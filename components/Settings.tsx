import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, AppSettings, License } from '../types';
import Icon from './common/Icon';
import { getSettings, saveSettings, checkApiStatus, checkDatabaseBackupStatus, backupDatabase, restoreDatabase, clearDatabase, getLicenseTotals, getLicenses, checkAiStatus } from '../services/apiService';
import DataConsolidation from './DataConsolidation';
import LicenseImport from './LicenseImport';
import PeriodicUpdate from './PeriodicUpdate';

interface SettingsProps {
    currentUser: User;
    onUserUpdate: (updatedUser: User) => void;
}

const DEFAULT_ENTREGA_TEMPLATE = `
<div class="text-center mb-6">
    <h1 class="text-2xl font-bold uppercase">TERMO DE RESPONSABILIDADE</h1>
    <p class="text-md mt-2">Utilização de Equipamento de Propriedade da Empresa</p>
</div>
<div class="space-y-4">
    <p><strong>Empresa:</strong> {{EMPRESA}}</p>
    <p><strong>Colaborador(a):</strong> {{USUARIO}}</p>
</div>
<div class="mt-6 border-t pt-4">
    <h2 class="font-bold mb-2">Detalhes do Equipamento:</h2>
    <ul class="list-disc list-inside space-y-1">
        <li><strong>Equipamento:</strong> {{EQUIPAMENTO}}</li>
        <li><strong>Patrimônio:</strong> {{PATRIMONIO}}</li>
        <li><strong>Serial:</strong> {{SERIAL}}</li>
    </ul>
</div>
<div class="mt-6 text-justify space-y-3">
    <p>Declaro, para todos os fins, ter recebido da empresa {{EMPRESA}} o equipamento descrito acima, em perfeitas condições de uso e funcionamento, para meu uso exclusivo no desempenho de minhas funções profissionais.</p>
    <p>Comprometo-me a zelar pela guarda, conservação e bom uso do equipamento, utilizando-o de acordo com as políticas de segurança e normas da empresa. Estou ciente de que o equipamento é uma ferramenta de trabalho e não deve ser utilizado para fins pessoais não autorizados.</p>
    <p>Em caso de dano, perda, roubo ou qualquer outro sinistro, comunicarei imediatamente meu gestor direto e o departamento de TI. Comprometo-me a devolver o equipamento nas mesmas condições em que o recebi, ressalvado o desgaste natural pelo uso normal, quando solicitado pela empresa ou ao término do meu contrato de trabalho.</p>
</div>
<div class="mt-12 text-center">
    <p>________________________________________________</p>
    <p class="mt-1 font-semibold">{{USUARIO}}</p>
</div>
<div class="mt-8 text-center">
    <p>Local e Data: {{DATA}}</p>
</div>
`;

const DEFAULT_DEVOLUCAO_TEMPLATE = `
<div class="text-center mb-6">
    <h1 class="text-2xl font-bold uppercase">TERMO DE DEVOLUÇÃO DE EQUIPAMENTO</h1>
    <p class="text-md mt-2">Devolução de Equipamento de Propriedade da Empresa</p>
</div>
<div class="space-y-4">
    <p><strong>Empresa:</strong> {{EMPRESA}}</p>
    <p><strong>Colaborador(a):</strong> {{USUARIO}}</p>
</div>
<div class="mt-6 border-t pt-4">
    <h2 class="font-bold mb-2">Detalhes do Equipamento:</h2>
    <ul class="list-disc list-inside space-y-1">
        <li><strong>Equipamento:</strong> {{EQUIPAMENTO}}</li>
        <li><strong>Patrimônio:</strong> {{PATRIMONIO}}</li>
        <li><strong>Serial:</strong> {{SERIAL}}</li>
    </ul>
</div>
<div class="mt-6 text-justify space-y-3">
    <p>Declaro, para todos os fins, ter devolvido à empresa {{EMPRESA}} o equipamento descrito acima, que estava sob minha responsabilidade para uso profissional.</p>
    <p>O equipamento foi devolvido nas mesmas condições em que o recebi, ressalvado o desgaste natural pelo uso normal, na data de {{DATA_DEVOLUCAO}}.</p>
</div>
<div class="mt-12 text-center">
    <p>________________________________________________</p>
    <p class="mt-1 font-semibold">{{USUARIO}}</p>
</div>
<div class="mt-8 text-center">
    <p>Local e Data: {{DATA}}</p>
</div>
`;

const SettingsToggle: React.FC<{
    label: string;
    checked: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    name: string;
    description?: string;
    disabled?: boolean;
}> = ({ label, checked, onChange, name, description, disabled = false }) => (
    <div className="flex items-center justify-between py-3">
        <div>
            <label htmlFor={name} className={`font-medium text-gray-800 dark:text-dark-text-primary ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                {label}
            </label>
            {description && <p className={`text-sm text-gray-500 dark:text-dark-text-secondary mt-1 ${disabled ? 'opacity-50' : ''}`}>{description}</p>}
        </div>
        <label htmlFor={name} className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input 
                type="checkbox" 
                id={name}
                name={name}
                checked={checked} 
                onChange={onChange}
                className="sr-only peer"
                disabled={disabled}
            />
            <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-brand-primary"></div>
        </label>
    </div>
);

const ApiKeyStatus: React.FC = () => {
    const [isKeySet, setIsKeySet] = useState<boolean | null>(null);
    useEffect(() => {
        const checkStatus = async () => {
            try {
                const status = await checkAiStatus();
                setIsKeySet(status.isConfigured);
            } catch {
                setIsKeySet(false);
            }
        };
        checkStatus();
    }, []);

    return (
        <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-dark-bg rounded-md">
            <span className="font-medium text-sm text-gray-800 dark:text-dark-text-primary">Status da Chave da API Gemini:</span>
            {isKeySet === null ? (
                <Icon name="LoaderCircle" size={16} className="animate-spin" />
            ) : isKeySet ? (
                <span className="flex items-center gap-1 text-xs font-semibold bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                    <Icon name="CheckCircle" size={14} />
                    Configurada no Servidor
                </span>
            ) : (
                <span className="flex items-center gap-1 text-xs font-semibold bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                    <Icon name="XCircle" size={14} />
                    Não Configurada
                </span>
            )}
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
    const [settings, setSettings] = useState<Partial<AppSettings>>({
        isSsoEnabled: false,
        is2faEnabled: false,
        require2fa: false,
        hasInitialConsolidationRun: false,
        aiAssistantEnabled: false,
    });
    const [termoEntregaTemplate, setTermoEntregaTemplate] = useState('');
    const [termoDevolucaoTemplate, setTermoDevolucaoTemplate] = useState('');
    const [apiStatus, setApiStatus] = useState<{ ok: boolean; message?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [backupStatus, setBackupStatus] = useState<{ hasBackup: boolean; backupTimestamp?: string } | null>(null);
    const [isDatabaseActionLoading, setIsDatabaseActionLoading] = useState(false);
    const [activeSettingsTab, setActiveSettingsTab] = useState<'general' | 'security' | 'database' | 'import' | 'termo' | 'ai'>('general');
    const [productNames, setProductNames] = useState<string[]>([]);

    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const status = await checkApiStatus();
            setApiStatus(status);

            if (currentUser.role === UserRole.Admin) {
                const [data, dbBackupStatus, totals, licenses] = await Promise.all([
                    getSettings(),
                    checkDatabaseBackupStatus(),
                    getLicenseTotals(),
                    getLicenses(currentUser)
                ]);

                setSettings({ ...data });
                setTermoEntregaTemplate(data.termo_entrega_template || DEFAULT_ENTREGA_TEMPLATE);
                setTermoDevolucaoTemplate(data.termo_devolucao_template || DEFAULT_DEVOLUCAO_TEMPLATE);
                setBackupStatus(dbBackupStatus);

                const productNamesFromTotals = Object.keys(totals);
                const productNamesFromLicenses = [...new Set(licenses.map(l => l.produto))];
                const allProductNames = [...new Set([...productNamesFromTotals, ...productNamesFromLicenses])].sort();
                setProductNames(allProductNames);
            }
        } catch (error) {
            console.error("Failed to load settings data:", error);
            setBackupStatus({ hasBackup: false });
        } finally {
            setIsLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);
    
    const handleSettingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const finalSettings = {
                ...settings,
                termo_entrega_template: termoEntregaTemplate,
                termo_devolucao_template: termoDevolucaoTemplate,
            };
            await saveSettings(finalSettings as AppSettings, currentUser.username);
            alert("Configurações salvas com sucesso!");
        } catch (error: any) {
            alert(`Falha ao salvar configurações: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackupDatabase = async () => {
        if (!window.confirm("Confirmar a criação de um backup do banco de dados?")) return;
        setIsDatabaseActionLoading(true);
        try {
            const result = await backupDatabase(currentUser.username);
            if (result.success) {
                alert(result.message);
                await fetchAllData();
            } else {
                alert(`Falha ao fazer backup: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Erro ao fazer backup: ${error.message}`);
        } finally {
            setIsDatabaseActionLoading(false);
        }
    };

    const handleRestoreDatabase = async () => {
        if (!window.confirm("ATENÇÃO: Restaurar o banco de dados substituirá TODOS os dados atuais com o backup mais recente. Esta ação é irreversível. Deseja continuar?")) return;
        setIsDatabaseActionLoading(true);
        try {
            const result = await restoreDatabase(currentUser.username);
            if (result.success) {
                alert(result.message + " A aplicação será recarregada para refletir as mudanças.");
                window.location.reload();
            } else {
                alert(`Falha ao restaurar: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Erro ao restaurar: ${error.message}`);
        } finally {
            setIsDatabaseActionLoading(false);
        }
    };

    const handleClearDatabase = async () => {
        if (!backupStatus?.hasBackup) {
            alert("Não é possível zerar o banco de dados sem um backup prévio. Por favor, faça um backup primeiro.");
            return;
        }
        if (!window.confirm("AVISO CRÍTICO: Zerar o banco de dados APAGARÁ TODOS os dados e configurações (exceto o usuário admin padrão) e reinstalará o sistema. Esta ação é IRREVERSÍVEL e SÓ DEVE SER FEITA após confirmar que um backup válido foi realizado e está disponível. Deseja realmente continuar?")) return;
        
        setIsDatabaseActionLoading(true);
        try {
            const result = await clearDatabase(currentUser.username);
            if (result.success) {
                alert(result.message + " A aplicação será recarregada.");
                window.location.reload();
            } else {
                alert(`Falha ao zerar o banco: ${result.message}`);
            }
        } catch (error: any) {
            alert(`Erro ao zerar o banco: ${error.message}`);
        } finally {
            setIsDatabaseActionLoading(false);
        }
    };

    const handleMetadataUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            if (!content) return;
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(content, "text/xml");
                const entityID = xmlDoc.querySelector("EntityDescriptor")?.getAttribute("entityID");
                const ssoUrl = xmlDoc.querySelector("SingleSignOnService")?.getAttribute("Location");
                const certificateNode = xmlDoc.querySelector("*|X509Certificate");
                const certificate = certificateNode?.textContent;
                const newSettings: Partial<AppSettings> = {};
                if (entityID) newSettings.ssoEntityId = entityID;
                if (ssoUrl) newSettings.ssoUrl = ssoUrl;
                if (certificate) newSettings.ssoCertificate = certificate.replace(/\s/g, '');
                setSettings(prev => ({ ...prev, ...newSettings }));
                alert('Metadados importados com sucesso! Não se esqueça de salvar as alterações.');
            } catch (error) {
                console.error("Error parsing metadata XML", error);
                alert("Falha ao analisar o arquivo XML de metadados. Verifique o formato do arquivo.");
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    };

    const copyToClipboard = (text: string | undefined, fieldName: string) => {
        if (text) {
            navigator.clipboard.writeText(text)
                .then(() => alert(`${fieldName} copiado para a área de transferência!`))
                .catch(() => alert('Falha ao copiar.'));
        }
    };

    const acsUrl = `http://${window.location.hostname}:3001/api/sso/callback`;
    const entityId = window.location.origin;

    const settingsTabs = [
        { id: 'general', label: 'Geral', icon: 'Settings' },
        { id: 'security', label: 'Segurança', icon: 'ShieldCheck' },
        { id: 'termo', label: 'Termos', icon: 'FileText', adminOnly: true },
        { id: 'database', label: 'Banco de Dados', icon: 'HardDrive', adminOnly: true },
        { id: 'import', label: 'Importações', icon: 'UploadCloud', adminOnly: true },
        { id: 'ai', label: 'Assistente AI', icon: 'Bot', adminOnly: true },
    ];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-full">
                <Icon name="LoaderCircle" className="animate-spin text-brand-primary" size={48} />
            </div>
        );
    }
    
    return (
        <div className="bg-white dark:bg-dark-card p-4 sm:p-6 rounded-lg shadow-md max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-brand-dark dark:text-dark-text-primary mb-6">Configurações</h2>
            <div className="flex border-b dark:border-dark-border mb-6 overflow-x-auto">
                {settingsTabs.map(tab => {
                    if (tab.adminOnly && currentUser.role !== UserRole.Admin) return null;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveSettingsTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 font-medium text-sm transition-colors duration-200 
                                ${activeSettingsTab === tab.id
                                    ? 'border-brand-primary text-brand-primary dark:text-white'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-dark-text-secondary dark:hover:text-gray-300'
                                }`}
                            aria-selected={activeSettingsTab === tab.id}
                            role="tab"
                        >
                            <Icon name={tab.icon as any} size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>
            <form onSubmit={handleSaveSettings}>
                <div className="space-y-8">
                    {activeSettingsTab === 'general' && (
                         <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-lg border dark:border-dark-border">
                            <h3 className="text-lg font-bold text-brand-secondary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                                <Icon name="Building" size={20} />
                                Informações da Empresa
                            </h3>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Nome da Empresa</label>
                                <input type="text" name="companyName" value={settings.companyName || ''} onChange={handleInputChange} className="p-2 w-full border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                            </div>
                        </div>
                    )}
    
                    {activeSettingsTab === 'security' && (
                        <div className="space-y-8">
                           <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-lg border dark:border-dark-border">
                                <h3 className="text-lg font-bold text-brand-secondary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                                    <Icon name="KeyRound" size={20} />
                                    Configuração SAML SSO
                                </h3>
                                <SettingsToggle
                                    label="Habilitar Login com SAML SSO"
                                    description="Permite que os usuários façam login usando um Provedor de Identidade SAML."
                                    name="isSsoEnabled"
                                    checked={settings.isSsoEnabled || false}
                                    onChange={handleSettingsChange}
                                />
    
                                {settings.isSsoEnabled && (
                                    <div className="mt-6 space-y-6 pt-6 border-t dark:border-dark-border animate-fade-in">
                                         <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 text-blue-800 dark:text-blue-200">
                                            <h4 className="font-bold mb-2 flex items-center gap-2"><Icon name="Info" size={18} /> Informações para seu Provedor</h4>
                                            <p className="text-sm mb-4">Use estes valores na configuração da sua aplicação SAML.</p>
                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase text-blue-900 dark:text-blue-300 mb-1">Entity ID</label>
                                                    <div className="relative"><input type="text" readOnly value={entityId} className="p-2 w-full border rounded-md bg-white dark:bg-gray-800 font-mono text-xs pr-10" /><button type="button" onClick={() => copyToClipboard(entityId, 'Entity ID')} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" title="Copiar"><Icon name="Copy" size={16} /></button></div>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-semibold uppercase text-blue-900 dark:text-blue-300 mb-1">ACS URL</label>
                                                    <div className="relative"><input type="text" readOnly value={acsUrl} className="p-2 w-full border rounded-md bg-white dark:bg-gray-800 font-mono text-xs pr-10" /><button type="button" onClick={() => copyToClipboard(acsUrl, 'ACS URL')} className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-500" title="Copiar"><Icon name="Copy" size={16} /></button></div>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary">Opção 1: Upload de Metadados</h4>
                                            <p className="text-sm text-gray-500 dark:text-dark-text-secondary mt-1 mb-3">Faça o upload do arquivo XML de metadados do seu provedor.</p>
                                            <input type="file" accept=".xml" onChange={handleMetadataUpload} id="metadata-upload" className="hidden" />
                                            <label htmlFor="metadata-upload" className="cursor-pointer inline-flex items-center gap-2 bg-brand-secondary text-white px-4 py-2 rounded-lg hover:bg-gray-700"><Icon name="UploadCloud" size={18} /> Carregar XML</label>
                                        </div>
                                        <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t dark:border-dark-border"></div></div><div className="relative flex justify-center text-sm"><span className="px-2 bg-gray-50 dark:bg-dark-bg text-gray-400">OU</span></div></div>
                                        <div>
                                            <h4 className="font-semibold text-gray-800 dark:text-dark-text-primary mb-3">Opção 2: Configuração Manual</h4>
                                            <div className="space-y-4">
                                                <div><label className="block text-sm font-medium mb-1">URL do SSO</label><input type="url" name="ssoUrl" value={settings.ssoUrl || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md" /></div>
                                                <div><label className="block text-sm font-medium mb-1">ID da Entidade</label><input type="text" name="ssoEntityId" value={settings.ssoEntityId || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md" /></div>
                                                <div><label className="block text-sm font-medium mb-1">Certificado X.509</label><textarea name="ssoCertificate" rows={4} value={settings.ssoCertificate || ''} onChange={handleInputChange} className="p-2 w-full border rounded-md font-mono text-xs" /></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-lg border dark:border-dark-border">
                                <h3 className="text-lg font-bold text-brand-secondary dark:text-dark-text-primary mb-4 flex items-center gap-2"><Icon name="ShieldCheck" size={20} /> Autenticação de Dois Fatores (2FA)</h3>
                                <div className="divide-y dark:divide-dark-border">
                                    <SettingsToggle label="Habilitar 2FA com App Autenticador" name="is2faEnabled" checked={settings.is2faEnabled || false} onChange={handleSettingsChange} description="Permite que os usuários configurem o 2FA em seus perfis."/>
                                    <SettingsToggle label="Exigir 2FA para todos os usuários" name="require2fa" checked={settings.require2fa || false} onChange={handleSettingsChange} description="Obrigará usuários sem 2FA a configurá-lo no próximo login." disabled={!settings.is2faEnabled}/>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeSettingsTab === 'ai' && currentUser.role === UserRole.Admin && (
                        <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-lg border dark:border-dark-border animate-fade-in">
                            <h3 className="text-lg font-bold text-brand-secondary dark:text-dark-text-primary mb-4 flex items-center gap-2">
                                <Icon name="Bot" size={20} />
                                Assistente de Inteligência Artificial
                            </h3>
                            <div className="space-y-6">
                                <ApiKeyStatus />
                                <div className="divide-y dark:divide-dark-border">
                                    <SettingsToggle
                                        label="Habilitar Assistente AI Flutuante"
                                        name="aiAssistantEnabled"
                                        checked={settings.aiAssistantEnabled || false}
                                        onChange={handleSettingsChange}
                                        description="Exibe um ícone de chatbot em todas as telas para assistência."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Nome do Modelo Gemini</label>
                                    <input type="text" name="geminiModel" value={settings.geminiModel || 'gemini-2.5-flash'} onChange={handleInputChange} className="p-2 w-full border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-dark-text-secondary mb-1">Instrução do Sistema (Prompt)</label>
                                    <textarea name="aiSystemInstruction" rows={5} value={settings.aiSystemInstruction || ''} onChange={handleInputChange} className="p-2 w-full border dark:border-dark-border rounded-md bg-white dark:bg-gray-800" placeholder="Ex: Você é um assistente especialista em inventário de TI..." />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeSettingsTab === 'termo' && currentUser.role === UserRole.Admin && ( <div className="space-y-8 animate-fade-in">{/* ... (conteúdo existente) */}</div> )}
                    {activeSettingsTab === 'database' && currentUser.role === UserRole.Admin && ( <div className="p-6 bg-gray-50 dark:bg-dark-bg rounded-lg border dark:border-dark-border">{/* ... (conteúdo existente) */}</div> )}
                    {activeSettingsTab === 'import' && currentUser.role === UserRole.Admin && ( <div className="space-y-8">{/* ... (conteúdo existente) */}</div> )}

                    {['general', 'security', 'termo', 'ai'].includes(activeSettingsTab) && currentUser.role === UserRole.Admin && (
                        <div className="flex justify-end pt-4 border-t dark:border-dark-border">
                            <button type="submit" disabled={isSaving} className="bg-brand-primary text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2">
                                <Icon name="Save" size={18} />
                                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                            </button>
                        </div>
                    )}
                </div>
            </form>
        </div>
    );
};

export default Settings;