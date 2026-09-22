import { getApi, FileDownloader } from '@microsoft/vscode-file-downloader-api';
import {ExtensionContext} from "vscode";
import * as vscode from 'vscode';

type GitBinary = {
    name: string,
    browser_download_url: string
}
export type GitBinaryItem = {
    name: string,
    downloadURL: string
}

export let binaries: GitBinaryItem[] = [];

export async function DownloadBinary(ctx: ExtensionContext, name: string) {
    let binary: GitBinaryItem | undefined;
    let downloadedBinary: vscode.Uri = vscode.Uri.parse('');
    let githubBinaries = binaries;
    
    try {
        binary = githubBinaries.find((item: GitBinaryItem) => {
            const isArchive = item.name.endsWith('.tar.gz') || item.name.endsWith('.zip');
            const isChecksum = item.name.endsWith('.sha256');

            return item.name.includes(name) && isArchive && !isChecksum;
        });

        if (!binary) {
            throw new Error(`No downloadable archive found for ${name}`);
        }

        const fileDownloader: FileDownloader = await getApi();
    
        downloadedBinary = await fileDownloader.downloadFile(
            vscode.Uri.parse(binary.downloadURL),
            binary.name,
            ctx
        );

        vscode.window.showInformationMessage(`Downloaded: ${binary.name}`);
    } catch(err) {
        vscode.window.showErrorMessage(`${err}`);
    }

    return downloadedBinary.fsPath;
}

export async function GetLSPBinariesData() {

    const url: string = 'https://api.github.com/repos/metacall/lsp/releases/latest';
    try {
        const res: Response = await fetch(url,
            {
                headers: { 'User-Agent': 'vscode-extension' }
            }
        );

        const data: any = await res.json();

        binaries = data.assets.map((asset: GitBinary) => {
            let item: GitBinaryItem = {
                name: asset.name,
                downloadURL: asset.browser_download_url
            };
    
            return item;
        });
    } catch(err) {
        vscode.window.showErrorMessage(`${err}`);
    }
}