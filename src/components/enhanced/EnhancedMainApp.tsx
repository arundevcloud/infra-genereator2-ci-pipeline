import React, { useState } from 'react';
import { Cloud, Layers, Monitor, History, Save, Settings, Zap, Shield, DollarSign, User, LogOut, Menu, X } from 'lucide-react';
import { useBasicAuth } from '../../contexts/BasicAuthContext';
import EnhancedHeader from './EnhancedHeader';
import EnhancedDashboard from './EnhancedDashboard';
import DeploymentModeSelector from '../DeploymentModeSelector';
import ConfigurationForm from '../ConfigurationForm';
import TerraformPreview from '../TerraformPreview';
import GitHubIntegration from '../GitHubIntegration';
import WorkflowStatus from '../WorkflowStatus';
import K8sConfigurationForm from '../K8sConfigurationForm';
import K8sManifestPreview from '../K8sManifestPreview';
import K8sGitHubIntegration from '../K8sGitHubIntegration';
import K8sWorkflowStatus from '../K8sWorkflowStatus';
import CIPipelineForm from '../CIPipelineForm';
import CIPipelinePreview from '../CIPipelinePreview';
import CIGitHubIntegration from '../CIGitHubIntegration';
import ResourceMonitoring from '../ResourceMonitoring';
import BasicDeploymentHistory from '../history/BasicDeploymentHistory';
import BasicSavedConfigurations from '../configurations/BasicSavedConfigurations';
import { 
  loadAppState, 
  saveAppState, 
  saveTerraformConfig, 
  saveGitHubConfig, 
  saveK8sConfig, 
  saveK8sGitHubConfig, 
  saveDeploymentMode 
} from '../../utils/storage';
import { getDefaultCIConfig } from '../../utils/ciGenerator';
import { saveBasicDeployment } from '../../utils/basicDeploymentTracking';

type DeploymentMode = 'infrastructure' | 'application';
type InfraTab = 'config' | 'terraform' | 'github' | 'deploy';
type AppTab = 'k8s-config' | 'k8s-manifest' | 'k8s-github' | 'k8s-deploy';
type CITab = 'ci-config' | 'ci-preview' | 'ci-github' | 'ci-manage';

const EnhancedMainApp: React.FC = () => {
  const { user, signOut } = useBasicAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Load initial state
  const initialState = loadAppState();
  const [deploymentMode, setDeploymentMode] = useState<DeploymentMode>(initialState.deploymentMode);
  const [activeInfraTab, setActiveInfraTab] = useState<InfraTab>(initialState.activeInfraTab);
  const [activeAppTab, setActiveAppTab] = useState<AppTab>(initialState.activeAppTab);
  const [activeCITab, setActiveCITab] = useState<CITab>('ci-config');

  // Configuration states
  const [terraformConfig, setTerraformConfig] = useState(initialState.terraformConfig);
  const [githubConfig, setGithubConfig] = useState(initialState.githubConfig);
  const [k8sConfig, setK8sConfig] = useState(initialState.k8sConfig);
  const [k8sGithubConfig, setK8sGithubConfig] = useState(initialState.k8sGithubConfig);
  const [ciConfig, setCiConfig] = useState(getDefaultCIConfig());
  const [ciGithubConfig, setCiGithubConfig] = useState(initialState.k8sGithubConfig);

  // Status states
  const [infraStatus, setInfraStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [appStatus, setAppStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');

  // Save state changes
  const handleDeploymentModeChange = (mode: DeploymentMode) => {
    setDeploymentMode(mode);
    saveDeploymentMode(mode);
  };

  const handleTerraformConfigChange = (config: any) => {
    setTerraformConfig(config);
    saveTerraformConfig(config);
  };

  const handleGithubConfigChange = (config: any) => {
    setGithubConfig(config);
    saveGitHubConfig(config);
  };

  const handleK8sConfigChange = (config: any) => {
    setK8sConfig(config);
    saveK8sConfig(config);
  };

  const handleK8sGithubConfigChange = (config: any) => {
    setK8sGithubConfig(config);
    saveK8sGitHubConfig(config);
  };

  const handleDeploymentStart = (workflowUrl: string, type: 'infrastructure' | 'application') => {
    if (user) {
      saveBasicDeployment({
        deployment_type: type,
        project_name: type === 'infrastructure' ? terraformConfig.clusterName : k8sConfig.clusterName,
        configuration: type === 'infrastructure' ? terraformConfig : k8sConfig,
        status: 'pending',
        github_repo: type === 'infrastructure' ? `${githubConfig.owner}/${githubConfig.repo}` : `${k8sGithubConfig.owner}/${k8sGithubConfig.repo}`,
        workflow_url: workflowUrl,
        notes: `${type === 'infrastructure' ? 'GKE cluster' : 'Application'} deployment via IaC Generator`
      });
    }
  };

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor, description: 'Overview and insights' },
    { id: 'infrastructure', label: 'Infrastructure', icon: Cloud, description: 'GKE clusters and resources' },
    { id: 'applications', label: 'Applications', icon: Layers, description: 'K8s deployments and services' },
    { id: 'ci-pipeline', label: 'CI/CD Pipeline', icon: Zap, description: 'Docker builds and registry' },
    { id: 'resources', label: 'Resources', icon: Settings, description: 'Real-time monitoring' },
    { id: 'history', label: 'History', icon: History, description: 'Deployment history' },
    { id: 'saved-configs', label: 'Saved Configs', icon: Save, description: 'Saved configurations' },
  ];

  const renderInfrastructureContent = () => {
    switch (activeInfraTab) {
      case 'config':
        return (
          <ConfigurationForm
            config={terraformConfig}
            onChange={handleTerraformConfigChange}
            onNext={() => setActiveInfraTab('terraform')}
          />
        );
      case 'terraform':
        return (
          <TerraformPreview
            config={terraformConfig}
            onBack={() => setActiveInfraTab('config')}
            onNext={() => setActiveInfraTab('github')}
          />
        );
      case 'github':
        return (
          <GitHubIntegration
            config={githubConfig}
            terraformConfig={terraformConfig}
            onChange={handleGithubConfigChange}
            onBack={() => setActiveInfraTab('terraform')}
            onNext={() => setActiveInfraTab('deploy')}
          />
        );
      case 'deploy':
        return (
          <WorkflowStatus
            githubConfig={githubConfig}
            terraformConfig={terraformConfig}
            status={infraStatus}
            onStatusChange={setInfraStatus}
            onBack={() => setActiveInfraTab('github')}
            onDeploymentStart={(url) => handleDeploymentStart(url, 'infrastructure')}
          />
        );
      default:
        return null;
    }
  };

  const renderApplicationContent = () => {
    switch (activeAppTab) {
      case 'k8s-config':
        return (
          <K8sConfigurationForm
            config={k8sConfig}
            onChange={handleK8sConfigChange}
            onNext={() => setActiveAppTab('k8s-manifest')}
          />
        );
      case 'k8s-manifest':
        return (
          <K8sManifestPreview
            config={k8sConfig}
            onBack={() => setActiveAppTab('k8s-config')}
            onNext={() => setActiveAppTab('k8s-github')}
          />
        );
      case 'k8s-github':
        return (
          <K8sGitHubIntegration
            config={k8sGithubConfig}
            k8sConfig={k8sConfig}
            onChange={handleK8sGithubConfigChange}
            onBack={() => setActiveAppTab('k8s-manifest')}
            onNext={() => setActiveAppTab('k8s-deploy')}
          />
        );
      case 'k8s-deploy':
        return (
          <K8sWorkflowStatus
            githubConfig={k8sGithubConfig}
            k8sConfig={k8sConfig}
            status={appStatus}
            onStatusChange={setAppStatus}
            onBack={() => setActiveAppTab('k8s-github')}
            onDeploymentStart={(url) => handleDeploymentStart(url, 'application')}
          />
        );
      default:
        return null;
    }
  };

  const renderCIPipelineContent = () => {
    switch (activeCITab) {
      case 'ci-config':
        return (
          <CIPipelineForm
            config={ciConfig}
            onChange={setCiConfig}
            onNext={() => setActiveCITab('ci-preview')}
          />
        );
      case 'ci-preview':
        return (
          <CIPipelinePreview
            config={ciConfig}
            onBack={() => setActiveCITab('ci-config')}
            onNext={() => setActiveCITab('ci-github')}
          />
        );
      case 'ci-github':
        return (
          <CIGitHubIntegration
            config={ciGithubConfig}
            ciConfig={ciConfig}
            onChange={setCiGithubConfig}
            onBack={() => setActiveCITab('ci-preview')}
            onNext={() => setActiveCITab('ci-manage')}
          />
        );
      case 'ci-manage':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">CI/CD Pipeline Management</h2>
            <p className="text-gray-600">Pipeline management interface coming soon...</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnhancedDashboard />;
      case 'infrastructure':
        return (
          <div className="space-y-6">
            <DeploymentModeSelector
              mode={deploymentMode}
              onChange={handleDeploymentModeChange}
            />
            
            {/* Infrastructure Sub-navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'config', label: 'Configuration' },
                    { id: 'terraform', label: 'Terraform Code' },
                    { id: 'github', label: 'GitHub Setup' },
                    { id: 'deploy', label: 'Deploy & Manage' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInfraTab(tab.id as InfraTab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeInfraTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              {renderInfrastructureContent()}
            </div>
          </div>
        );
      case 'applications':
        return (
          <div className="space-y-6">
            <DeploymentModeSelector
              mode={deploymentMode}
              onChange={handleDeploymentModeChange}
            />
            
            {/* Applications Sub-navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'k8s-config', label: 'Configuration' },
                    { id: 'k8s-manifest', label: 'Manifests' },
                    { id: 'k8s-github', label: 'GitHub Setup' },
                    { id: 'k8s-deploy', label: 'Deploy & Manage' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveAppTab(tab.id as AppTab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeAppTab === tab.id
                          ? 'border-purple-500 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              {renderApplicationContent()}
            </div>
          </div>
        );
      case 'ci-pipeline':
        return (
          <div className="space-y-6">
            {/* CI/CD Pipeline Sub-navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  {[
                    { id: 'ci-config', label: 'Configuration' },
                    { id: 'ci-preview', label: 'Pipeline Preview' },
                    { id: 'ci-github', label: 'GitHub Setup' },
                    { id: 'ci-manage', label: 'Manage Pipeline' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveCITab(tab.id as CITab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeCITab === tab.id
                          ? 'border-green-500 text-green-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              {renderCIPipelineContent()}
            </div>
          </div>
        );
      case 'resources':
        return (
          <ResourceMonitoring
            githubConfig={githubConfig}
            terraformConfig={terraformConfig}
          />
        );
      case 'history':
        return <BasicDeploymentHistory />;
      case 'saved-configs':
        return (
          <BasicSavedConfigurations
            currentInfraConfig={terraformConfig}
            currentAppConfig={k8sConfig}
            onLoadConfiguration={(config, type) => {
              if (type === 'infrastructure') {
                handleTerraformConfigChange(config);
                setActiveTab('infrastructure');
                setActiveInfraTab('config');
              } else {
                handleK8sConfigChange(config);
                setActiveTab('applications');
                setActiveAppTab('k8s-config');
              }
            }}
          />
        );
      default:
        return <EnhancedDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Enhanced Header */}
      <EnhancedHeader />

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden lg:flex lg:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto bg-white/80 backdrop-blur-xl border-r border-white/20">
              <div className="flex-grow flex flex-col">
                <nav className="flex-1 px-2 space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md w-full text-left transition-all duration-200 ${
                          activeTab === item.id
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className={`mr-3 h-5 w-5 ${
                          activeTab === item.id ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                        }`} />
                        <div>
                          <div className="font-medium">{item.label}</div>
                          <div className={`text-xs ${
                            activeTab === item.id ? 'text-white/80' : 'text-gray-500'
                          }`}>
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setShowMobileMenu(false)} />
            <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
              <div className="absolute top-0 right-0 -mr-12 pt-2">
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setShowMobileMenu(false);
                        }}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md w-full text-left ${
                          activeTab === item.id
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon className="mr-4 h-6 w-6 text-gray-400" />
                        {item.label}
                      </button>
                    );
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {renderMainContent()}
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default EnhancedMainApp;