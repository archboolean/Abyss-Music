import { InvokeChannel, IpcInvokeMap, EventChannel, IpcEventMap } from '../../shared/ipc';

export async function invokeIpc<C extends InvokeChannel>(
  channel: C,
  ...args: IpcInvokeMap[C]['args']
): Promise<IpcInvokeMap[C]['result'] | null> {
  if (!window.abyssApi) {
    console.warn(`[IPC mock] ${channel}`, args);
    return null;
  }

  try {
    return await window.abyssApi.invoke(channel, ...args);
  } catch (error) {
    console.warn(`[IPC error] ${channel}:`, error);
    return null;
  }
}

export function subscribeIpc<C extends EventChannel>(
  channel: C,
  listener: (payload: IpcEventMap[C]) => void
): () => void {
  if (!window.abyssApi) {
    return () => {};
  }
  return window.abyssApi.on(channel, listener);
}