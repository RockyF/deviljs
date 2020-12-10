/**
 * Created by rockyl on 2020/12/10.
 */

import merge from 'merge'

export interface GitAuth {
	username: string;
	password: string;
	client_id: string;
	client_secret: string;
	scope: string;
}

/**
 * 配置类型
 */
export interface Config {
	gitHost: string;
	gitUser: string;
	gitRepo: string;
	gitPublishBrunch?: string;
	gitAuth: GitAuth;
	logHub?: (logType: string, ...args: any[]) => void;
}

const defaultConfig = {
	gitPublishBrunch: 'master',
}

let _config: Config = <Config>{};

/**
 * 注入配置
 * @param config
 */
export function injectConfig(config: Config) {
	const c = merge.recursive(true, defaultConfig, config);
	Object.assign(_config, c);
}

export default _config;
