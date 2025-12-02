import React, { useMemo, useState } from 'react';
import AddressForm from './AddressForm';
import { addressesAPI } from '../../utils/api';

const pad2 = (n) => String(n).padStart(2, '0');

const toLocalDatetimeInputValue = (date) => {
  // yyyy-mm-ddThh:mm en HORA LOCAL (no UTC)
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const mi = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const OrderForm = ({
  addresses = [],
  orderForm,
  onAddressChange,
  onNotesChange,
  onPaymentMethodChange,
  onPlaceOrder,
  onAddressAdded,
  disabled,
  toast,

  // ✅ NUEVO (para pedido programado)
  scheduleEnabled = false,
  scheduledFor = "",
  onScheduleEnabledChange = () => {},
  onScheduledForChange = () => {},
  scheduleMaxHours = 48,
}) => {
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const minSchedule = useMemo(() => {
    const d = new Date(Date.now() + 5 * 60 * 1000); // +5 min
    return toLocalDatetimeInputValue(d);
  }, []);

  const maxSchedule = useMemo(() => {
    const d = new Date(Date.now() + scheduleMaxHours * 60 * 60 * 1000);
    return toLocalDatetimeInputValue(d);
  }, [scheduleMaxHours]);

  const scheduleError =
    scheduleEnabled && !scheduledFor
      ? "Selecciona fecha y hora para programar el pedido."
      : null;

  const handleAddAddress = async (addressData) => {
    try {
      setIsLoading(true);
      const response = await addressesAPI.create(addressData);
      const newAddress = response.address || response;

      onAddressAdded?.(newAddress);
      setShowAddressForm(false);

      if (newAddress && newAddress.id) {
        onAddressChange({ target: { value: newAddress.id } });
      }

      toast?.success?.('Dirección guardada correctamente');
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Error desconocido';
      if (toast?.error) toast.error(`Error al guardar la dirección: ${errorMessage}`);
      else alert(`Error al guardar la dirección: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Formulario de Pedido</h3>

      <div className="space-y-4">
        {/* Dirección */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">Dirección de entrega</label>
            {!showAddressForm && (
              <button
                type="button"
                onClick={() => setShowAddressForm(true)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                + Agregar dirección
              </button>
            )}
          </div>

          {showAddressForm ? (
            <div className="mb-4">
              <AddressForm onSave={handleAddAddress} onCancel={() => setShowAddressForm(false)} />
            </div>
          ) : (
            <select
              value={orderForm.addressId}
              onChange={onAddressChange}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent mb-4"
              required
            >
              <option value="">Seleccionar dirección</option>
              {addresses.map((addr) => (
                <option key={addr.id} value={addr.id}>
                  {addr.street}, {addr.city} {addr.isDefault ? '(Principal)' : ''}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* ✅ Programar pedido */}
        <div className="border border-gray-200 rounded-lg p-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
            <input
              type="checkbox"
              checked={scheduleEnabled}
              onChange={(e) => {
                const enabled = e.target.checked;
                onScheduleEnabledChange(enabled);
                if (!enabled) onScheduledForChange("");
              }}
            />
            Programar pedido para más tarde
          </label>

          {scheduleEnabled && (
            <div className="mt-3 space-y-2">
              <label className="block text-sm text-gray-700">Fecha y hora</label>
              <input
                type="datetime-local"
                value={scheduledFor}
                onChange={(e) => onScheduledForChange(e.target.value)}
                min={minSchedule}
                max={maxSchedule}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500">
                * El sistema valida que sea futuro, horario del restaurante y máximo {scheduleMaxHours} horas.
              </p>

              {scheduleError && (
                <p className="text-xs text-red-600 font-medium">{scheduleError}</p>
              )}
            </div>
          )}
        </div>

        {/* Método de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => onPaymentMethodChange('CASH')}
              className={`p-3 border rounded-lg flex items-center justify-center ${
                orderForm.paymentMethod === 'CASH'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Efectivo
            </button>
            <button
              type="button"
              onClick={() => onPaymentMethodChange('CARD')}
              className={`p-3 border rounded-lg flex items-center justify-center ${
                orderForm.paymentMethod === 'CARD'
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              Tarjeta
            </button>
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Notas especiales</label>
          <textarea
            value={orderForm.notes}
            onChange={onNotesChange}
            placeholder="Instrucciones especiales para la entrega..."
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            rows="3"
          />
        </div>

        {/* Confirmar */}
        <button
          onClick={onPlaceOrder}
          disabled={disabled || isLoading || Boolean(scheduleError)}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold"
        >
          {scheduleEnabled ? 'Confirmar Pedido Programado' : 'Confirmar Pedido'}
        </button>
      </div>
    </div>
  );
};

export default OrderForm;
