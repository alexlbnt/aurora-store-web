// Estado do navegador guardado no localStorage (sacola, favoritos), lido pelo React com
// useSyncExternalStore: no servidor e na hidratação vale o valor vazio, e no navegador o salvo.
// Assim não há setState dentro de efeito nem diferença entre o HTML do servidor e o do navegador.

export interface LocalStore<T> {
  subscribe: (onChange: () => void) => () => void;
  getSnapshot: () => T;
  getServerSnapshot: () => T;
  /** Grava e avisa quem está ouvindo. */
  set: (next: T) => void;
}

export function createLocalStore<T>(key: string, parse: (raw: unknown) => T, empty: T): LocalStore<T> {
  let cache: { value: T } | null = null;
  const listeners = new Set<() => void>();

  const read = (): T => {
    if (!cache) {
      let value = empty;
      try {
        const raw = localStorage.getItem(key);
        if (raw) value = parse(JSON.parse(raw));
      } catch (e) {
        console.warn(`Aviso ao ler "${key}" do navegador:`, e);
      }
      cache = { value };
    }
    return cache.value;
  };

  return {
    subscribe(onChange) {
      listeners.add(onChange);
      // Outra aba mudou o mesmo dado: relê na próxima leitura.
      const onStorage = (e: StorageEvent) => {
        if (e.key === key) {
          cache = null;
          onChange();
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
      };
    },
    getSnapshot: read,
    getServerSnapshot: () => empty,
    set(next) {
      cache = { value: next };
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* navegador sem espaço ou em modo restrito: segue só na memória */
      }
      listeners.forEach((l) => l());
    },
  };
}

const noopSubscribe = () => () => {};
/** true no navegador depois da hidratação; false no servidor. Para useSyncExternalStore. */
export const mountedStore = {
  subscribe: noopSubscribe,
  getSnapshot: () => true,
  getServerSnapshot: () => false,
};
