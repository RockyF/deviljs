/**
 * Created by rockyl on 2020/12/10.
 */

import path = require("path");
import * as fs from "fs-extra";
import {getModulesCode, getRepoCommitInfo} from "./git";
import {ProjectVM} from "./ProjectVM";
import {MODULE_LIFECYCLE_DEINIT, MODULE_LIFECYCLE_INIT} from "./constants";

const projectVMMapping = {};

/**
 * 获取一个项目虚拟机
 * @param pid
 * @param createIfNotExists
 */
function getProjectVM(pid, createIfNotExists = false) {
	let projectVM = projectVMMapping[pid];
	if (!projectVM && createIfNotExists) {
		projectVM = projectVMMapping[pid] = new ProjectVM(pid);
	}
	return projectVM;
}

/**
 * 从文本源码方式放置一个模块
 * @param pid
 * @param moduleName
 * @param code
 */
function putModuleFromText(pid, moduleName, code) {
	getProjectVM(pid, true).putModule(moduleName, code);
}

/**
 * 获取项目列表
 */
export function getProjects() {
	let projects = [];
	for (let id in projectVMMapping) {
		let p: ProjectVM = projectVMMapping[id];
		projects.push(p.shortcut);
	}
	return projects;
}

/**
 * 设置项目可访问性
 * 是否可访问，才能执行doAction
 * @param pid
 * @param accessible
 */
export function setProjectAccessible(pid, accessible) {
	let projectVM: ProjectVM = getProjectVM(pid);
	if (projectVM) {
		projectVM.forbidden = !accessible;
	} else {
		return true;
	}
}

/**
 * 锁或解锁项目
 * 直接解锁状态的项目才可增加模块
 * @param pid
 * @param locked
 */
export function lockProject(pid, locked) {
	let projectVM: ProjectVM = getProjectVM(pid);
	if (projectVM) {
		projectVM.locked = locked;
	} else {
		return true;
	}
}

/**
 * 从文件放置一个模块
 * @param moduleCodeFile
 * @param pid
 * @param moduleName
 */
export async function putModule(moduleCodeFile, pid, moduleName) {
	const moduleCode = await fs.readFile(moduleCodeFile, 'utf-8');
	putModuleFromText(pid, moduleName, moduleCode);
}

/**
 * 从git拉取并放置一个项目的所有模块
 * @param pid
 */
export async function putModuleFromGit(pid) {
	const repoCommitInfo = await getRepoCommitInfo();
	let projectVM = getProjectVM(pid, true);
	if (projectVM.repoCommitInfo.sha !== repoCommitInfo.sha) {
		projectVM.updateRepoCommitInfo(repoCommitInfo)
		const modulesCode: any = await getModulesCode(pid);

		if (modulesCode) {
			for (let {fileName, code} of modulesCode) {
				const moduleName = path.basename(fileName, path.extname(fileName))
				putModuleFromText(pid, moduleName, code);
			}
		}
		return true;
	}
	return false;
}

/**
 * 执行动作
 * 前提：项目可访问
 * @param pid
 * @param moduleName
 * @param action
 * @param args
 */
export async function doAction(pid, moduleName, action, args) {
	if (action === MODULE_LIFECYCLE_INIT || action === MODULE_LIFECYCLE_DEINIT) {
		let err: any = new Error(`action [${action}] not exists`);
		err.code = 4;
		throw err;
	}
	let projectVM: ProjectVM = getProjectVM(pid);
	if (projectVM) {
		return projectVM.doAction(moduleName, action, args);
	} else {
		let err: any = new Error('project not exists');
		err.code = 3;
		throw err;
	}
}
