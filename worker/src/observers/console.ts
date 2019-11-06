import {Observer, ConsoleLevels, ConsoleRecord, MessageTypes} from '../interfaces/observer'
import { _replace, _unReplace, _log } from '../utils/tools'
import { RECORD_CONFIG } from './constants'
import {sendToServer} from "../utils/requestServer";

export default class ConsoleObserver implements Observer {
  private consoleLevels = Object.keys(RECORD_CONFIG.console)

  public options = RECORD_CONFIG.console

  constructor(options?: any) {
    if (typeof options === 'boolean' && options === false) {
      return
    }

    if (typeof options === 'object') {
      this.options = { ...this.options, ...options }
    }
  }

    private sendRecord(record) {
        sendToServer(MessageTypes.console, record).then(resData => {
            console.log("event:", resData);
        });
    }

  public install(): void {
    this.consoleLevels.forEach(
      (level): void => {
        if (!this.options[level]) return

        let consoleReplacement= (originalConsoleFunc: Function) =>{
          return (...args: any[])=> {
            if (!args.length) return

            const record: ConsoleRecord = {
              type: 'console',
              level: level as ConsoleLevels,
              input: args
            }

            this.sendRecord(record);
            if (originalConsoleFunc) {
              originalConsoleFunc.call(console, ...args)
            }
          }
        }

        _replace(console, level, consoleReplacement)
      }
    )
    _log('console observer ready!')
  }

  public uninstall(): void {
    this.consoleLevels.forEach(
      (level): void => {
        if (!this.options[level]) return
        _unReplace(console, level)
      }
    )
  }
}
