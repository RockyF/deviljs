/**
 * Created by rockyl on 2020/11/11.
 */

import fetch from 'node-fetch'
import FormData = require('form-data');
import config from './config'

let accessToken, expiresTs, refreshToken;

function getGitApiHost() {
	return `${config.gitHost}/api/v5/repos/${config.gitUser}/${config.gitRepo}`;
}

export async function getModulesCode(pid) {
	const project = await getProject(pid);
	if (project) {
		const projectTree = await fetchTree(project.sha);
		return Promise.all(projectTree.map(async entity => {
			const code = await fetchBlob(entity.sha);
			return {
				code,
				fileName: entity.path,
			}
		}));
	} else {
		throw new Error('project not exists');
	}
}

export async function getRepoCommitInfo() {
	const brunch = await fetchBrunch(config.gitPublishBrunch);
	const {commit: {sha, commit: {author: {name: author}, message}}} = brunch;

	return {
		sha,
		author,
		message,
	};
}

async function getProject(pid) {
	const rootTree = await fetchTree(config.gitPublishBrunch);
	const srcEntity = rootTree.find(item => item.path == 'src');
	const srcTree = await fetchTree(srcEntity.sha);

	return srcTree.find(item => item.path == pid);
}

async function fetchBrunch(name) {
	await getToken();
	const resp = await fetch(getGitApiHost() + `/branches/${name}?access_token=${accessToken}`);
	return resp.json();
}

function fetchTree(sha) {
	return fetchGit(sha, 'tree').then(resp => resp.tree);
}

function fetchBlob(sha) {
	return fetchGit(sha, 'blob').then(resp => Buffer.from(resp.content, 'base64').toString());
}

async function fetchGit(sha, type: 'tree' | 'blob') {
	await getToken();
	const resp = await fetch(getGitApiHost() + `/git/${type}s/${sha}?access_token=${accessToken}`);
	return resp.json();
}

async function getToken() {
	let now, refresh;

	now = Math.floor(Date.now() / 1000);
	if (accessToken) {
		if (now < expiresTs) {
			return accessToken;
		} else {
			refresh = true;
		}
	}

	const formData = new FormData();
	if (refresh) {
		formData.append("grant_type", "refresh_token");
		formData.append("refresh_token", refreshToken);
	} else {
		formData.append("grant_type", "password");
		for (let key in config.gitAuth) {
			formData.append(key, config.gitAuth[key]);
		}
	}

	const requestOptions: any = {
		method: 'POST',
		body: formData,
	};

	const resp = await fetch(config.gitHost + "/oauth/token", requestOptions);
	const {access_token, expires_in, refresh_token, created_at} = await resp.json();
	accessToken = access_token;
	refreshToken = refresh_token;
	now = Math.floor(Date.now() / 1000);
	expiresTs = now + expires_in - created_at + now;

	return access_token;
}
