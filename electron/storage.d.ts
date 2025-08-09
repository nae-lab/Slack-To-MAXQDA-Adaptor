export interface SlackTokenInfo {
    id: string;
    token: string;
    teamName: string;
    userName: string;
    teamId: string;
    userId: string;
    createdAt: Date;
}
declare class SecureStorage {
    private store;
    constructor();
    private getEncryptionKey;
    private migrateLegacyToken;
    getSlackTokens(): SlackTokenInfo[];
    addSlackToken(tokenInfo: SlackTokenInfo): void;
    removeSlackToken(tokenId: string): void;
    getSelectedTokenId(): string | null;
    setSelectedTokenId(tokenId: string | null): void;
    getSelectedToken(): SlackTokenInfo | null;
    setSlackToken(token: string): void;
    getSlackToken(): string | null;
    clearSlackToken(): void;
    hasSlackToken(): boolean;
}
export declare const secureStorage: SecureStorage;
export {};
