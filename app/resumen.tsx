import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import * as Print from 'expo-print';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CLINICA } from '../src/config/clinic';
import { usePresupuesto } from '../src/context/PresupuestoContext';
import { calcularTotales } from '../src/domain/calculos';
import { validarPresupuesto, type ErrorValidacion } from '../src/domain/validaciones';
import { formatCurrency } from '../src/lib/currency';
import { formatDate } from '../src/lib/date';

const MENSAJES_ERROR: Record<ErrorValidacion, string> = {
  'paciente-incompleto': 'Faltan datos del paciente',
  'sin-tratamientos': 'Agrega al menos un tratamiento',
  'sin-tratamientos-validos': 'Agrega tratamientos válidos',
  'total-invalido': 'El total debe ser mayor a 0',
};

const getBase64Logo = async () => {
  try {
    const asset = Asset.fromModule(require('../assets/images/logo.png'));
    await asset.downloadAsync();

    const base64 = await FileSystem.readAsStringAsync(asset.localUri!, {
      encoding: FileSystem.EncodingType.Base64,
    });

    return `data:image/png;base64,${base64}`;
  } catch (error) {
    console.log('Error logo:', error);
    return '';
  }
};

export default function Resumen() {

  const { paciente, tratamientos, guardarPresupuesto, resetPresupuesto } = usePresupuesto();
  const params = useLocalSearchParams();
  
  const yaListo = params.listo === 'true';
  const [pdfGenerado, setPdfGenerado] = useState(yaListo);
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const generacionIniciada = useRef(false);

const generarPDF = useCallback(async () => {
  try {

    console.log('1. Iniciando generación');

    const error = validarPresupuesto(paciente, tratamientos);
    if (error) {
      Alert.alert('Error', MENSAJES_ERROR[error]);
      return;
    }

    const { tratamientosValidos, total } = calcularTotales(tratamientos);

    const logoBase64 = await getBase64Logo();
    console.log('2. Logo cargado');

    const html = `
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>

body {
  font-family: Arial, sans-serif;
  background: #f4f6f9;
  padding: 15px; /* menos espacio */
  color: #111827;
}

/*  HEADER */
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, #1e3a8a, #38bdf8);
  color: white;
  padding: 18px 22px; /*  más compacto */
  border-radius: 14px;
}

.header-text {
  flex: 1;
  text-align: center;
}

.logo {
  width: 75px;
  height: 75px;
  object-fit: contain;
}

.clinica {
  font-size: 26px;
  font-weight: bold;
}

.doctora {
  font-size: 16px;
  margin-top: 4px;
  opacity: 0.9;
}

/* INFO COMPACTA */
.info {
  margin-top: 15px;
  background: white;
  padding: 12px;
  border-radius: 10px;
}

.info-line {
  font-size: 16px;
}

/* TABLA */
.table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 15px;
  background: white;
  border-radius: 10px;
  overflow: hidden;
}

.table th {
  background: #1e3a8a;
  color: white;
  padding: 10px;
  text-align: left;
  font-size: 13px;
}

.table th:last-child {
  text-align: right;
}

.table td {
  padding: 10px 12px; /* 🔥 menos altura */
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle; /* 🔥 centra precio */
  word-break: break-word;
}

/*  DESCRIPCIÓN */
.descripcion {
  margin-top: 3px;
  color: #4b5563;
  max-width: 85%;
  line-height: 1.3;
  font-size: 13px;
}

/*  PRECIO PERFECTO */
.precio {
  text-align: right;
  font-weight: bold;
  color: #1d4ed8;
  white-space: nowrap;
  vertical-align: middle;
  font-size: 14px;
}

/*  TOTAL COMPACTO */
.total {
  margin-top: 15px;
  background: linear-gradient(90deg, #2563eb, #38bdf8);
  color: white;
  padding: 14px; /*  reducido */
  border-radius: 12px;
  text-align: right; /* 🔥 estilo más pro */
  font-size: 16px;
  font-weight: bold;
}

</style>
</head>

<body>

<div class="header">
  <div class="header-text">
    <div class="clinica">${CLINICA.nombre}</div>
    <div class="doctora">${CLINICA.doctora}</div>
  </div>
  <img class="logo" src="${logoBase64}" />
</div>

<div class="info">
  <div class="info-line">
    <b>Paciente:</b> ${paciente.nombre}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Edad:</b> ${paciente.edad}
    &nbsp;&nbsp;|&nbsp;&nbsp;
    <b>Fecha:</b> ${formatDate()}
  </div>
</div>

<table class="table">
<tr>
  <th>Tratamiento</th>
  <th>Costo</th>
</tr>

${tratamientosValidos.map((t) => `
<tr>
  <td>
    <b>${t.nombre}</b>
    <div class="descripcion">
      ${t.descripcion || ''}
    </div>
  </td>
  <td class="precio">
    $${formatCurrency(t.precio)} MXN
  </td>
</tr>
`).join('')}

</table>

<div class="total">
  TOTAL: $${formatCurrency(total)} MXN
</div>

</body>
</html>
`;;

    const { uri } = await Print.printToFileAsync({ html });

    console.log('3. PDF creado en:', uri);

    // NOMBRE SEGURO y unico
    const nombreLimpio = (paciente.nombre || 'paciente')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '');

    const timestamp = Date.now();

    const nuevoUri =
      FileSystem.documentDirectory +
      `Presupuesto_${nombreLimpio}_${timestamp}.pdf`;

    console.log('4. Ruta destino:', nuevoUri);

    // ELIMINAMOS deleteAsync → YA NO SE SOBREESCRIBE

    await FileSystem.copyAsync({
      from: uri,
      to: nuevoUri
    });

    console.log('5. PDF generado correctamente');

    guardarPresupuesto(nuevoUri);
    setPdfUri(nuevoUri);
    setPdfGenerado(true);

  } catch (error) {
    console.log('ERROR REAL PDF:', error);
    Alert.alert('Error', 'No se pudo generar el PDF');
  }
}, [paciente, tratamientos, guardarPresupuesto]);

      const compartirPDF = async () => {
        try {
          console.log('Intentando compartir:', pdfUri);

          if (!pdfUri) {
            Alert.alert('Error', 'Primero genera el PDF');
            return;
          }

          const existe = await FileSystem.getInfoAsync(pdfUri);
          console.log('Archivo existe:', existe);

          if (!existe.exists) {
            Alert.alert('Error', 'El archivo no existe');
            return;
          }

          await Sharing.shareAsync(pdfUri);

        } catch (error) {
          console.log('💥 ERROR SHARE:', error);
          Alert.alert('Error', 'No se pudo compartir');
        }
      };
      

   
    useEffect(() => {
      if (generacionIniciada.current) return;
      generacionIniciada.current = true;
      generarPDF();
    }, [generarPDF]);


      const { total } = calcularTotales(tratamientos);
return (
  <View style={styles.container}>

    {/* HEADER */}
    <Text style={styles.title}>Resumen</Text>

    {/* CARD */}
    <View style={styles.card}>
      <Text style={styles.label}>Paciente</Text>
      <Text style={styles.value}>
        {paciente.nombre} - {paciente.edad} años
      </Text>

      <View style={{ height: 10 }} />

      <Text style={styles.label}>Total</Text>
      <Text style={styles.total}>
        ${formatCurrency(total)}
      </Text>
    </View>

    {/* BOTONES */}
    <View style={styles.buttons}>

      {/* 🔵 PRINCIPAL (MISMA FUNCIÓN) */}
      <TouchableOpacity
        style={styles.primaryButton}
        onPress={compartirPDF}
      >
        <Text style={styles.buttonText}>Compartir PDF</Text>
      </TouchableOpacity>

      {/* 🔘 RESTO IGUAL */}
      {pdfGenerado && (
        <>
          <View style={{ height: 10 }} />

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.replace('/tratamientos')}
          >
            <Text style={styles.buttonText}>Editar tratamientos</Text>
          </TouchableOpacity>

          <View style={{ height: 10 }} />

          <TouchableOpacity
            style={styles.darkButton}
            onPress={() => {
              resetPresupuesto();
              router.dismissAll();
              router.replace('/');
            }}
          >
            <Text style={styles.buttonText}>Ir al inicio</Text>
          </TouchableOpacity>
        </>
      )}

    </View>

  </View>
);
}
const styles = StyleSheet.create({

  container: {
  flex: 1,
  padding: 20,
  paddingTop: 80, // aquí controlas cuánto baja
  },

  primaryButton: {
  backgroundColor: '#2563eb',
  padding: 18,
  borderRadius: 12,
  marginBottom: 15,
  shadowColor: '#2563eb',
  shadowOpacity: 0.6,
  shadowRadius: 10,
  elevation: 5
},

  secondaryButton: {
    backgroundColor: '#6b7280',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10
  },

  darkButton: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12
  },

  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16
  },
  title: {
  fontSize: 22,
  fontWeight: '700',
  marginBottom: 20,
  textAlign: 'center',
  color: '#020617',
},

card: {
  backgroundColor: '#fff',
  borderRadius: 16,
  padding: 18,
  marginBottom: 25,

  shadowColor: '#000',
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
},

label: {
  fontSize: 13,
  color: '#64748B',
},

value: {
  fontSize: 16,
  fontWeight: '600',
  color: '#020617',
},

total: {
  fontSize: 24,
  fontWeight: '800',
  color: '#3B82F6',
  marginTop: 4,
},

buttons: {
  marginTop: 'auto',
  marginBottom: 60, // subir los botones verticalmente
},

});


