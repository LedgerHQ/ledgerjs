
package com.ledgerwallet.hid;

import android.hardware.usb.UsbDeviceConnection;
import android.hardware.usb.UsbEndpoint;
import android.hardware.usb.UsbInterface;
import android.hardware.usb.UsbRequest;
import android.hardware.usb.UsbConstants;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.util.Log;

import com.facebook.react.bridge.Promise;

import java.io.ByteArrayOutputStream;
import java.nio.ByteBuffer;

public class HIDDevice {

    private UsbDeviceConnection connection;
    private UsbInterface dongleInterface;
    private UsbEndpoint in;
    private UsbEndpoint out;
    private byte transferBuffer[];
    private boolean debug;
    private boolean ledger;

    public HIDDevice(UsbManager manager, UsbDevice device) {
        UsbInterface dongleInterface = device.getInterface(0);
        UsbEndpoint in = null;
        UsbEndpoint out = null;
        for (int i = 0; i < dongleInterface.getEndpointCount(); i++) {
            UsbEndpoint tmpEndpoint = dongleInterface.getEndpoint(i);
            if (tmpEndpoint.getDirection() == UsbConstants.USB_DIR_IN) {
                in = tmpEndpoint;
            } else {
                out = tmpEndpoint;
            }
        }
        UsbDeviceConnection connection = manager.openDevice(device);
        connection.claimInterface(dongleInterface, true);

        this.connection = connection;
        this.dongleInterface = dongleInterface;
        this.in = in;
        this.out = out;

        transferBuffer = new byte[HID_BUFFER_SIZE];
    }

    public void exchange(byte[] command, Promise p) throws Exception {
        ByteArrayOutputStream response = new ByteArrayOutputStream();
        byte[] responseData = null;
        int offset = 0;
        int responseSize;
        command = LedgerHelper.wrapCommandAPDU(LEDGER_DEFAULT_CHANNEL, command, HID_BUFFER_SIZE);
        if (debug) {
            Log.d("HIDDevice", "=> " + toHex(command));
        }

        UsbRequest request = new UsbRequest();
        if (!request.initialize(connection, out)) {
            throw new Exception("I/O error");
        }
        while (offset != command.length) {
            int blockSize = (command.length - offset > HID_BUFFER_SIZE ? HID_BUFFER_SIZE : command.length - offset);
            System.arraycopy(command, offset, transferBuffer, 0, blockSize);
            if (!request.queue(ByteBuffer.wrap(transferBuffer), HID_BUFFER_SIZE)) {
                request.close();
                throw new Exception("I/O error");
            }
            connection.requestWait();
            offset += blockSize;
        }
        ByteBuffer responseBuffer = ByteBuffer.allocate(HID_BUFFER_SIZE);
        request = new UsbRequest();
        if (!request.initialize(connection, in)) {
            request.close();
            throw new Exception("I/O error");
        }

        while ((responseData = LedgerHelper.unwrapResponseAPDU(LEDGER_DEFAULT_CHANNEL, response.toByteArray(),
                HID_BUFFER_SIZE)) == null) {
            responseBuffer.clear();
            if (!request.queue(responseBuffer, HID_BUFFER_SIZE)) {
                request.close();
                throw new Exception("I/O error");
            }
            connection.requestWait();
            responseBuffer.rewind();
            responseBuffer.get(transferBuffer, 0, HID_BUFFER_SIZE);
            response.write(transferBuffer, 0, HID_BUFFER_SIZE);
        }

        if (debug) {
            Log.d("HIDDevice", "<= " + toHex(responseData));
        }

        request.close();
        p.resolve(toHex(responseData));
    }

    public static String toHex(byte[] buffer, int offset, int length) {
        String result = "";
        for (int i = 0; i < length; i++) {
            String temp = Integer.toHexString((buffer[offset + i]) & 0xff);
            if (temp.length() < 2) {
                temp = "0" + temp;
            }
            result += temp;
        }
        return result;
    }

    public static String toHex(byte[] buffer) {
        return toHex(buffer, 0, buffer.length);
    }

    public void close(Promise p) throws Exception {
        connection.releaseInterface(dongleInterface);
        connection.close();

        p.resolve(null);
    }

    public void setDebug(boolean debugFlag) {
        this.debug = debugFlag;
    }

    private static final int HID_BUFFER_SIZE = 64;
    private static final int LEDGER_DEFAULT_CHANNEL = 1;
    private static final int SW1_DATA_AVAILABLE = 0x61;

}
