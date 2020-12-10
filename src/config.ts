/**
 * Created by rockyl on 2020/12/10.
 */

import merge from 'merge'

/**
 * 配置类型
 */
export interface Config {
	gitHost: string,
	gitUser: string,
	gitRepo: string,
	gitPublishBrunch?: string;
	gitAuth: {
		username: string,
		password: string,
		client_id: string,
		client_secret: string,
		scope: string,
	},
	logHub?: (logType: string, ...args) => void,
}

const defaultConfig = {
	publishBrunch: 'master',
}

let _config: Config = <Config>{};

/**
 * 注入配置
 * @param config
 */
export function injectConfig(config: Config) {
	_config = merge.recursive(true, defaultConfig, config);
}

export default _config;
