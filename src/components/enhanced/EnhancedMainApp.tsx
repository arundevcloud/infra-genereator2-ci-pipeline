import React, { useState } from 'react';
import { Cloud, Layers, Zap } from 'lucide-react';
import { useBasicAuth } from '../../contexts/BasicAuthContext';
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
import { 
  loadAppState, 
  saveTerraformConfig, 
  saveGitHubConfig, 
  saveK8sConfig, 
  saveK8sGitHubConfig
} from '../../utils/storage';
import { getDefaultCIConfig } from '../../utils/ciGenerator';
import { saveBasicDeployment } from '../../utils/basicDeploymentTracking';

type InfraTab = 'config' | 'terraform' | 'github' | 'deploy';
type AppTab = 'k8s-config' | 'k8s-manifest' | 'k8s-github' | 'k8s-deploy';
type CITab = 'ci-config' | 'ci-preview' | 'ci-github';

const EnhancedMainApp: React.FC = () => {
  const { user, signOut } = useBasicAuth();
  const [activeTab, setActiveTab] = useState('infrastructure');

  // Load initial state
  const initialState = loadAppState();
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

  const mainTabs = [
    { id: 'infrastructure', label: 'Infrastructure', icon: Cloud, description: 'GKE clusters and resources' },
    { id: 'applications', label: 'Applications', icon: Layers, description: 'K8s deployments and services' },
    { id: 'ci-pipeline', label: 'CI/CD Pipeline', icon: Zap, description: 'Docker builds and registry' },
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
            onNext={() => {}}
          />
        );
      default:
        return null;
    }
  };

  const renderMainContent = () => {
    switch (activeTab) {
      case 'infrastructure':
        return (
          <div className="space-y-6">
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
                    { id: 'ci-github', label: 'GitHub Setup' }
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
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Simple Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Cloud className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">IaC Generator</h1>
                <p className="text-sm text-gray-500">Infrastructure & Application Platform</p>
              </div>
            </div>

            {/* User Menu */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-sm font-medium text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                </div>
                <button
                  onClick={signOut}
                  
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Navigation */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm: px-6 lg:px-8">
          <nav className="flex space-x-8">
            {mainTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1  border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <div className="text-left">
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-500">{tab.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default EnhancedMainApp;