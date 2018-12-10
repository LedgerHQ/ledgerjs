const EventEmitter = require('events')
const usb = require('usb')
const debounce = require('lodash/debounce')
const getDevices = require('./getDevices')

module.exports = function (delay, listenDevicesPollingSkip, debug) {
  const events = new EventEmitter()
  events.setMaxListeners(0)

  let listDevices = getDevices()

  const flatDevice = d => d.path

  const getFlatDevices = () => [
    ...new Set(getDevices().map(d => flatDevice(d)))
  ]

  const getDeviceByPaths = paths =>
    listDevices.find(d => paths.includes(flatDevice(d)))

  let lastDevices = getFlatDevices()

  const poll = () => {
    if (!listenDevicesPollingSkip()) {
      debug('Polling for added or removed devices')

      let changeFound = false
      const currentDevices = getFlatDevices()
      const newDevices = currentDevices.filter(d => !lastDevices.includes(d))

      if (newDevices.length > 0) {
        debug('New device found:', newDevices)

        listDevices = getDevices()
        events.emit('add', getDeviceByPaths(newDevices))

        changeFound = true
      } else {
        debug('No new device found')
      }

      const removeDevices = lastDevices.filter(
        d => !currentDevices.includes(d)
      )

      if (removeDevices.length > 0) {
        debug('Removed device found:', removeDevices)

        events.emit('remove', getDeviceByPaths(removeDevices))
        listDevices = listDevices.filter(
          d => !removeDevices.includes(flatDevice(d))
        )

        changeFound = true
      } else {
        debug('No removed device found')
      }

      if (changeFound) {
        lastDevices = currentDevices
      }
    } else {
      debug('Polling skipped, re-debouncing')
      debouncedPoll()
    }
  }

  const debouncedPoll = debounce(poll, delay)

  const attachDetected = device => {
    debug('Device add detected:', device)

    debouncedPoll()
  }
  usb.on('attach', attachDetected)
  debug('attach listener added')

  const detachDetected = device => {
    debug('Device removal detected:', device)

    debouncedPoll()
  }
  usb.on('detach', detachDetected)
  debug('detach listener added')

  return {
    stop: () => {
      debug(
        'Stop received, removing listeners and cancelling pending debounced polls'
      )
      debouncedPoll.cancel()
      usb.removeListener('attach', attachDetected)
      usb.removeListener('detach', detachDetected)
    },
    events
  }
}
