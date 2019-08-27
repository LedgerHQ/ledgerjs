//@flow

declare class HIDDevice {
  oninputreport: EventHandler;
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  addEventListener(string, EventHandler): void;
  removeEventListener(string, EventHandler): void;
}
