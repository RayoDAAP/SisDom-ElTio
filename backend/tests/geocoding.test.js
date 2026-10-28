/**
 * @file geocoding.test.js
 * @description Pruebas unitarias para funciones de limpieza, clasificador de features y contratos de geocodificación.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cleanCalle,
  cleanColonia,
  cleanNumero,
  classifyFeature,
} from '../src/services/GeocodingService.js';

test('Limpieza de Calle (cleanCalle)', async (t) => {
  await t.test('debe conservar nombres propios como Constitución', () => {
    assert.equal(cleanCalle('Constitución'), 'Constitución');
  });

  await t.test('debe limpiar prefijo CALLE en mayúsculas', () => {
    assert.equal(cleanCalle('CALLE Río Sena'), 'Río Sena');
  });

  await t.test('debe limpiar prefijo C.', () => {
    assert.equal(cleanCalle('C. Hidalgo'), 'Hidalgo');
  });

  await t.test('debe conservar Colón sin recortar letras', () => {
    assert.equal(cleanCalle('Colón'), 'Colón');
  });

  await t.test('debe conservar Nogales sin recortar letras', () => {
    assert.equal(cleanCalle('Nogales'), 'Nogales');
  });

  await t.test('debe conservar Norte sin recortar letras', () => {
    assert.equal(cleanCalle('Norte'), 'Norte');
  });

  await t.test('debe conservar Las Quintas sin recortar letras', () => {
    assert.equal(cleanCalle('Las Quintas'), 'Las Quintas');
  });

  await t.test('debe conservar Pinto Suárez sin recortar letras', () => {
    assert.equal(cleanCalle('Pinto Suárez'), 'Pinto Suárez');
  });

  await t.test('debe eliminar código postal final', () => {
    assert.equal(cleanCalle('Río Amazonas C.P. 66400'), 'Río Amazonas');
  });
});

test('Limpieza de Colonia (cleanColonia)', async (t) => {
  await t.test('debe limpiar prefijo COL. y código postal', () => {
    assert.equal(cleanColonia('COL. Villas de Oriente C.P. 66400'), 'Villas de Oriente');
  });

  await t.test('debe limpiar prefijo COLONIA', () => {
    assert.equal(cleanColonia('COLONIA Centro'), 'Centro');
  });

  await t.test('debe limpiar sufijo Sector 2', () => {
    assert.equal(cleanColonia('Valle del Mezquital Sector 2'), 'Valle del Mezquital');
  });

  await t.test('debe conservar Nogales', () => {
    assert.equal(cleanColonia('Nogales'), 'Nogales');
  });
});

test('Limpieza de Número (cleanNumero)', async (t) => {
  await t.test('debe limpiar prefijo No.', () => {
    assert.equal(cleanNumero('No. 750'), '750');
  });

  await t.test('debe limpiar prefijo #', () => {
    assert.equal(cleanNumero('#750'), '750');
  });

  await t.test('debe limpiar prefijo Num.', () => {
    assert.equal(cleanNumero('Num. 750'), '750');
  });

  await t.test('debe remover sufijo int 2', () => {
    assert.equal(cleanNumero('750 int 2'), '750');
  });

  await t.test('debe remover sufijo interior B', () => {
    assert.equal(cleanNumero('750 interior B'), '750');
  });

  await t.test('debe conservar S/N', () => {
    assert.equal(cleanNumero('S/N'), 'S/N');
  });

  await t.test('debe conservar número directo 608', () => {
    assert.equal(cleanNumero('608'), '608');
  });
});

test('Clasificación de Features (classifyFeature)', async (t) => {
  await t.test('address + matched + rooftop -> exact', () => {
    const feature = {
      properties: {
        feature_type: 'address',
        match_code: { address_number: 'matched' },
        coordinates: { accuracy: 'rooftop' },
      },
    };
    assert.equal(classifyFeature(feature, '750'), 'exact');
  });

  await t.test('address + matched + interpolated -> interpolated', () => {
    const feature = {
      properties: {
        feature_type: 'address',
        match_code: { address_number: 'matched' },
        coordinates: { accuracy: 'interpolated' },
      },
    };
    assert.equal(classifyFeature(feature, '750'), 'interpolated');
  });

  await t.test('address sin match_code -> street', () => {
    const feature = {
      properties: {
        feature_type: 'address',
      },
    };
    assert.equal(classifyFeature(feature, '750'), 'street');
  });

  await t.test('street -> street', () => {
    const feature = {
      properties: {
        feature_type: 'street',
      },
    };
    assert.equal(classifyFeature(feature, '750'), 'street');
  });

  await t.test('neighborhood -> colonia', () => {
    const feature = {
      properties: {
        feature_type: 'neighborhood',
      },
    };
    assert.equal(classifyFeature(feature), 'colonia');
  });

  await t.test('place -> municipio', () => {
    const feature = {
      properties: {
        feature_type: 'place',
      },
    };
    assert.equal(classifyFeature(feature), 'municipio');
  });

  await t.test('objeto vacío -> municipio', () => {
    assert.equal(classifyFeature({}), 'municipio');
  });
});
