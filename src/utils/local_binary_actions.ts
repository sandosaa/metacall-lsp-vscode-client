import * as path from "path";
import {ExtensionContext} from "vscode";
import { readFile } from 'fs/promises';
import * as vscode from 'vscode';
import { extract } from 'dir-archiver';
import * as tar from 'tar';
import { binaries, GitBinaryItem } from "./download_binary";

export async function LoacateLSPBinary(ctx: ExtensionContext) {
    // path of metacall lsp archive
    const locatePath: vscode.Uri = vscode.Uri.parse(path.join(ctx.globalStorageUri.fsPath , 'file-downloader-downloads'));
    let isBinaryLocated: boolean = false;
    let archiveGot: string = '';
    // search and locate lsp binary
    try {
        let githubBinaries = binaries;
        const entriesGot = await vscode.workspace.fs.readDirectory(locatePath);
        
        const archiveEntriesFound = entriesGot.filter(([name, type]) => {
            if (type === vscode.FileType.File && (/^meta-call-lsp.*\.zip$/.test(name) || /^meta-call-lsp.*\.tar\.gz$/.test(name))) {
                const found: GitBinaryItem | undefined = githubBinaries.find((b) => b.name === name);
                if (found) {
                    archiveGot = name;
                    return true;
                } else {
                    return false;
                }
            }
            return false;
        });

        if (archiveEntriesFound.length > 0) {
            const archivePath:string = path.join(ctx.globalStorageUri.fsPath , 'file-downloader-downloads', archiveGot);
            await ExtractLSPArchive(archivePath);
            isBinaryLocated = true;
            return isBinaryLocated;
        }

        const binaryEntriesFound = entriesGot.filter(([name, type]) =>
            type === vscode.FileType.File && name === 'meta-call-lsp'
        );

        if (binaryEntriesFound.length > 0 && archiveEntriesFound.length > 0) {
            isBinaryLocated = true;
            return isBinaryLocated;
        }

    } catch(err) {
        vscode.window.showErrorMessage(`${err}`);
    }

    return isBinaryLocated;
}

export async function ExtractLSPArchive(archive: string) {
    const dest: string = path.dirname(archive);

    try {
        if (archive.endsWith('.zip')) {
            await extract(archive, dest);
            return;
        }

        if (archive.endsWith('.tar.gz') || archive.endsWith('.tgz')) {
            await tar.x({
                file: archive,
                cwd: dest,
                strip: 1, // extract contents in the same folder
            });
            return;
        }
    } catch(err) {
        vscode.window.showErrorMessage(`${err}`);
    }
}