/**
 * Created by rockyl on 2020/12/10.
 */

import {NodeVM, VMScript,} from 'vm2';
import {MODULE_LIFECYCLE_DEINIT, MODULE_LIFECYCLE_INIT} from "./constants";
import config from './config'

const logTypes = ['debug', 'log', 'info', 'warn', 'error', 'dir', 'trace'];

export class ProjectVM {
	readonly id;
	readonly vm: NodeVM;

	forbidden: boolean = false;
	locked: boolean = false;

	_repoCommitInfo: {
		author?: string,
		sha?: string,
		message?: string,
	} = {};

	private _modulesMapping = {};

	constructor(id) {
		this.id = id;
		this.vm = this.createVm();
	}

	get shortcut() {
		let modules = [];
		for (let name in this._modulesMapping) {
			modules.push({
				name,
			})
		}
		return {
			id: this.id,
			forbidden: this.forbidden,
			locked: this.locked,
			repoCommitInfo: this._repoCommitInfo,
			modules,
		}
	}

	private createVm(context: any = {}) {
		context.projectID = this.id;

		const vm = new NodeVM({
			require: {
				external: true,
			},
			sandbox: context,
			console: 'redirect',
		});

		for (let logType of logTypes) {
			vm.on('console.' + logType, this.logHub.bind(this, logType));
		}

		return vm;
	}

	private logHub(logType, ...args) {
		if (config.logHub) {
			config.logHub(logType, ...args);
		} else {
			console.log(`[${new Date().toLocaleString()}]`, `[${logType}]`, `[${this.id}]`, ...args);
		}
	}

	putModule(moduleName, bundle) {
		if (this.locked) {
			let err: any = new Error(`locked`);
			err.code = 11;
			throw err;
		} else {
			const script = new VMScript(bundle, 'custom-module.js');
			let module;
			try {
				let oldModule = this._modulesMapping[moduleName];
				if (oldModule) {
					this.doAction(moduleName, MODULE_LIFECYCLE_DEINIT, undefined, false)
						.catch(e => {
							console.log(e.message);
						});
				}
				module = this.vm.run(script);
				this._modulesMapping[moduleName] = module;
				this.doAction(moduleName, MODULE_LIFECYCLE_INIT, undefined, false)
					.catch(e => {
						console.log(e.message);
					});
				return module;
			} catch (e) {
				console.log('run script error:', e);
				throw e;
			}
		}
	}

	async doAction(moduleName, action, args?, checkNone = true) {
		if (this.forbidden) {
			let err: any = new Error(`forbidden`);
			err.code = 12;
			throw err;
		} else {
			const module = this._modulesMapping[moduleName];
			if (module.hasOwnProperty(action)) {
				let actionBody = module[action];
				try {
					let timeLabel = `do action [${action}]`;
					console.time(timeLabel);
					this.vm.freeze(args);
					this.vm.protect(args);
					const result = await actionBody.apply(module, args);
					console.timeEnd(timeLabel);
					return result;
				} catch (err) {
					console.log(`do action [action] error:`, err);
					err.code = 5;
					throw err;
				}
			} else if (checkNone) {
				let err: any = new Error(`action [${action}] not exists`);
				err.code = 4;
				throw err;
			}
		}
	}

	get repoCommitInfo() {
		return this._repoCommitInfo;
	}

	updateRepoCommitInfo(info) {
		let _info = this._repoCommitInfo;
		_info.author = info.author;
		_info.sha = info.sha;
		_info.message = info.message;
	}
}
