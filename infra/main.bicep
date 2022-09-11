param appName string
param location string
param repositoryUrl string
param repositoryToken string
param tags object

// storage account
module sta 'storage-accounts.bicep' = {
  name: 'deploy-st-${appName}'
  params: {
    location: location
    storageAccountName: 'st${replace(appName, '-', '')}'
    tags: tags
  }
}

//  blob storage and containers
module bs 'blob-services.bicep' = {
  name: 'deploy-blob-${appName}'
  params: {
    containerNames: [
      'music'
    ]
    storageAccountName: sta.outputs.storageAccountName
  }
}

// static site
module swa 'static-sites.bicep' = {
  name: 'deploy-swa-${appName}'
  params: {
    buildProperties: {
      skipGithubActionWorkflowGeneration: true
    }
    location: location
    repositoryBranch: 'main'
    repositoryUrl: repositoryUrl
    repositoryToken: repositoryToken
    sku: {
      name: 'Free'
      tier: 'Free'
    }
    stagingEnvironmentPolicy: 'Enabled'
    staticSiteName: 'stapp-${appName}'
    tags: tags
  }
}

output primaryBlobEndpoint string = sta.outputs.primaryBlobEndpoint
output secondaryBlobEndpoint string = sta.outputs.secondaryBlobEndpoint

output siteName string = swa.outputs.siteName
output siteDefaultHostname string = swa.outputs.defaultHostName
