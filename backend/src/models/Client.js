/**
 * @module Client
 * @description Modelo y almacén en memoria para clientes y empresas indexados por teléfono.
 */

export const clientStore = [
  {
    phone: '6145550192',
    name: 'Carlos Ruiz',
    type: 'particular',
    companyName: '',
    street: 'Av. Universidad',
    number: '1402',
    colonia: 'Centro',
  },
  {
    phone: '6149876543',
    name: 'Ing. Sofía Morales',
    type: 'empresa',
    companyName: 'Constructora del Norte SA',
    street: 'Periférico Juventud',
    number: '8900',
    colonia: 'Complejo Industrial',
  },
  {
    phone: '6142223344',
    name: 'María Fernández',
    type: 'particular',
    companyName: '',
    street: 'Calle 24a',
    number: '405',
    colonia: 'Santa Rosa',
  },
];

/**
 * Busca un cliente en el catálogo por su número de teléfono.
 * @param {string} phone
 * @returns {Object|null}
 */
export const findClientByPhone = (phone) => {
  if (!phone) return null;
  const cleanedPhone = phone.trim();
  return clientStore.find((c) => c.phone === cleanedPhone) || null;
};

/**
 * Registra o actualiza la información de un cliente por su número de teléfono.
 * @param {Object} clientData
 */
export const saveOrUpdateClient = (clientData) => {
  if (!clientData || !clientData.phone) return;
  const existingIndex = clientStore.findIndex((c) => c.phone === clientData.phone.trim());

  if (existingIndex !== -1) {
    clientStore[existingIndex] = { ...clientStore[existingIndex], ...clientData };
  } else {
    clientStore.push({ ...clientData });
  }
};
