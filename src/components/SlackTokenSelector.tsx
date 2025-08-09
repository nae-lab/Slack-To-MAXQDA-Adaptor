import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SlackTokenInfo } from "@/types/electron";

interface SlackTokenSelectorProps {
  onValueChange: (token: string) => void;
  onTokenValidated?: (
    isValid: boolean,
    tokenInfo?: { user: string; team: string }
  ) => void;
}

export function SlackTokenSelector({
  onValueChange,
  onTokenValidated,
}: SlackTokenSelectorProps) {
  const { t } = useTranslation();
  const [tokens, setTokens] = useState<SlackTokenInfo[]>([]);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newToken, setNewToken] = useState("");
  const [showNewToken, setShowNewToken] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [tokenValidation, setTokenValidation] = useState<{
    status: "idle" | "validating" | "valid" | "invalid";
    user?: string;
    team?: string;
    error?: string;
  }>({ status: "idle" });

  useEffect(() => {
    loadTokens();
  }, []);

  useEffect(() => {
    // Notify parent when validation status changes
    if (onTokenValidated) {
      onTokenValidated(
        tokenValidation.status === "valid",
        tokenValidation.status === "valid"
          ? {
              user: tokenValidation.user || "",
              team: tokenValidation.team || "",
            }
          : undefined
      );
    }
  }, [tokenValidation, onTokenValidated]);

  const loadTokens = async () => {
    try {
      const result = await window.electronAPI.getSlackTokens();
      if (result.success && result.tokens) {
        setTokens(result.tokens);

        if (result.selectedTokenId) {
          setSelectedTokenId(result.selectedTokenId);
          const selectedToken = result.tokens.find(
            (t) => t.id === result.selectedTokenId
          );
          if (selectedToken) {
            onValueChange(selectedToken.token);
            setTokenValidation({
              status: "valid",
              user: selectedToken.userName,
              team: selectedToken.teamName,
            });
          }
        } else if (result.tokens.length > 0) {
          // Auto-select first token if none selected
          const firstToken = result.tokens[0];
          if (firstToken) {
            setSelectedTokenId(firstToken.id);
            await window.electronAPI.selectSlackToken(firstToken.id);
            onValueChange(firstToken.token);
            setTokenValidation({
              status: "valid",
              user: firstToken.userName,
              team: firstToken.teamName,
            });
          }
        }
      }
    } catch (error) {
      console.error("Error loading tokens:", error);
    }
  };

  const handleSelectToken = async (tokenId: string) => {
    if (tokenId === "__add__") {
      // Open add dialog instead of selecting a token
      setShowAddDialog(true);
      return;
    }
    try {
      await window.electronAPI.selectSlackToken(tokenId);
      setSelectedTokenId(tokenId);

      const selectedToken = tokens.find((t) => t.id === tokenId);
      if (selectedToken) {
        onValueChange(selectedToken.token);
        setTokenValidation({
          status: "valid",
          user: selectedToken.userName,
          team: selectedToken.teamName,
        });
      }
    } catch (error) {
      console.error("Error selecting token:", error);
    }
  };

  const handleAddToken = async () => {
    if (!newToken.trim()) return;

    setIsAdding(true);
    setAddError("");

    try {
      const result = await window.electronAPI.addSlackToken(newToken.trim());
      if (result.success && result.tokenInfo) {
        // Update tokens list
        setTokens((prev) => [...prev, result.tokenInfo!]);
        // Select the new token automatically
        if (result.tokenInfo) {
          await handleSelectToken(result.tokenInfo.id);
        }
        // Close dialog and reset form
        setShowAddDialog(false);
        setNewToken("");
        setShowNewToken(false);
      } else {
        setAddError(result.error || "Failed to add token");
      }
    } catch (error) {
      setAddError((error as Error).message);
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveToken = async (tokenId: string) => {
    try {
      // Get remaining tokens before removal
      const remainingTokens = tokens.filter((t) => t.id !== tokenId);

      await window.electronAPI.removeSlackToken(tokenId);
      setTokens(remainingTokens);

      if (selectedTokenId === tokenId) {
        if (remainingTokens.length > 0 && remainingTokens[0]) {
          // Auto-select the first remaining token
          await handleSelectToken(remainingTokens[0].id);
        } else {
          // No tokens left, clear everything
          setSelectedTokenId(null);
          onValueChange("");
          setTokenValidation({ status: "idle" });
        }
      }
    } catch (error) {
      console.error("Error removing token:", error);
    }
  };

  const formatTokenDisplay = (token: SlackTokenInfo) => {
    return `${token.teamName} - ${token.userName}`;
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label>{t("export.token")}</Label>
        <div className="flex items-center gap-2">
          {tokenValidation.status === "validating" && (
            <div className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              <span className="text-xs text-muted-foreground">
                {t("validation.validating")}
              </span>
            </div>
          )}
          {tokenValidation.status === "valid" && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              <span className="text-xs text-green-600">
                {t("validation.valid")}
              </span>
            </div>
          )}
          {tokenValidation.status === "invalid" && (
            <div className="flex items-center gap-1">
              <XCircle className="h-3 w-3 text-red-600" />
              <span className="text-xs text-red-600">
                {t("validation.invalid")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Select
          value={selectedTokenId || ""}
          onValueChange={handleSelectToken}
          disabled={tokens.length === 0}
        >
          <SelectTrigger className="flex-1">
            <SelectValue
              placeholder={
                tokens.length === 0
                  ? t("tokenSelector.noTokens")
                  : t("tokenSelector.selectToken")
              }
            />
          </SelectTrigger>
          <SelectContent>
            {tokens.map((token) => (
              <SelectItem key={token.id} value={token.id}>
                <div className="flex items-center justify-between w-full">
                  <span>{formatTokenDisplay(token)}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveToken(token.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </SelectItem>
            ))}
            <SelectItem value="__add__">
              <div className="flex items-center gap-2 text-blue-600">
                <Plus className="h-4 w-4" />
                {t("tokenSelector.addToken")}
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAddDialog(true)}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          {t("tokenSelector.addToken")}
        </Button>
      </div>

      {tokenValidation.status === "valid" &&
        tokenValidation.user &&
        tokenValidation.team && (
          <div className="text-xs text-green-600">
            {t("validation.connectedAs", {
              user: tokenValidation.user,
              team: tokenValidation.team,
            })}
          </div>
        )}

      {tokenValidation.status === "invalid" && tokenValidation.error && (
        <div className="text-xs text-red-600">{tokenValidation.error}</div>
      )}

      <Dialog
        open={showAddDialog}
        onOpenChange={(open) => {
          setShowAddDialog(open);
          if (!open) {
            setNewToken("");
            setAddError("");
            setShowNewToken(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("tokenSelector.addNewToken")}</DialogTitle>
            <DialogDescription>
              {t("tokenSelector.addTokenDescription")}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newToken">{t("export.token")}</Label>
              <div className="relative">
                <Input
                  id="newToken"
                  type={showNewToken ? "text" : "password"}
                  placeholder={t("export.tokenPlaceholder")}
                  value={newToken}
                  onChange={(e) => setNewToken(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewToken(!showNewToken)}
                >
                  {showNewToken ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {addError && (
              <Alert variant="destructive">
                <AlertDescription>{addError}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddDialog(false);
                setNewToken("");
                setAddError("");
                setShowNewToken(false);
              }}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={handleAddToken}
              disabled={!newToken.trim() || isAdding}
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t("tokenSelector.adding")}
                </>
              ) : (
                t("tokenSelector.addToken")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
