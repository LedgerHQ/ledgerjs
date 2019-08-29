//@flow

declare type HIDDeviceFilter = {
  vendorId?: number,
  productId?: number,
  usagePage?: number,
  usage?: number
};

declare type HIDDeviceRequestOptions = {
  filters: HIDDeviceFilter[]
};

declare class HIDConnectionEvent extends Event {
  device: HIDDevice;
}

declare type HIDConnectionEventHandler = (event: HIDConnectionEvent) => mixed;

declare class HID extends EventTarget {
  getDevices(): Promise<HIDDevice[]>;
  requestDevice(options: HIDDeviceRequestOptions): Promise<HIDDevice>;
  addEventListener("connect", HIDConnectionEventHandler): void;
  removeEventListener("connect", HIDConnectionEventHandler): void;
  addEventListener("disconnect", HIDConnectionEventHandler): void;
  removeEventListener("disconnect", HIDConnectionEventHandler): void;
}

declare class InputReportEvent extends Event {
  data: DataView;
  device: HIDDevice;
  reportId: number;
}

declare type InputReportEventHandler = (event: InputReportEvent) => mixed;

declare class HIDDevice {
  oninputreport: InputReportEventHandler;
  opened: boolean;
  vendorId: number;
  productId: number;
  productName: string;
  open(): Promise<void>;
  close(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  sendFeatureReport(reportId: number, data: BufferSource): Promise<void>;
  receiveFeatureReport(reportId: number): Promise<DataView>;
  addEventListener("inputreport", InputReportEventHandler): void;
  removeEventListener("inputreport", InputReportEventHandler): void;
}
