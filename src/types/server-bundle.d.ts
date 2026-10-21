declare module '*/build/server.cjs' {
  import type { Express } from 'express';
  export const app: Express;
  const defaultExport: Express;
  export default defaultExport;
}
