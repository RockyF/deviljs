/**
 * Created by rockyl on 2020/12/10.
 */

import {Config, injectConfig} from "./config";

export * from './vm-manager'

export function setConfig(config: Config) {
	injectConfig(config);
}
