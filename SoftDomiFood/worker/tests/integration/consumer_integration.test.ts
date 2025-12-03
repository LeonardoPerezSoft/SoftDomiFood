import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Integración simulada: consumir un mensaje y llamar al repositorio mock

type OrderMessage = {
  type: 'ORDER_CREATED';
  payload: {
    orderId: string;
    userId: string;
    total: number;
  };
};

// Repositorio mock
const orderRepository = {
  calls: 0,
  async save(data: any) {
    this.calls += 1;
    return { ...data, saved: true };
  }
};

// Consumidor simulado que recibiría un mensaje de RabbitMQ
async function consumeMessage(msg: OrderMessage) {
  if (msg.type !== 'ORDER_CREATED') throw new Error('Unsupported message type');
  const { orderId, userId, total } = msg.payload;
  if (!orderId || !userId || typeof total !== 'number') throw new Error('Invalid payload');
  return await orderRepository.save({ orderId, userId, total });
}

describe('Consumer integration (mock)', () => {
  before(() => {
    orderRepository.calls = 0;
  });

  it('procesa mensaje ORDER_CREATED y persiste', async () => {
    const result = await consumeMessage({
      type: 'ORDER_CREATED',
      payload: { orderId: 'o-1', userId: 'u-1', total: 15000 }
    });

    assert.equal(orderRepository.calls, 1);
    assert.deepEqual(result, { orderId: 'o-1', userId: 'u-1', total: 15000, saved: true });
  });

  it('falla con payload inválido', async () => {
    let threw = false;
    try {
      // @ts-expect-error invalid payload
      await consumeMessage({ type: 'ORDER_CREATED', payload: { orderId: '', userId: '', total: 'NaN' } });
    } catch (e: any) {
      threw = true;
      assert.match(String(e?.message ?? e), /Invalid payload/);
    }
    assert.equal(threw, true);
  });
});
