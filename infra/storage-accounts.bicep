@description('Resource tags.')
param tags object

@description('Resource location.')
param location string

@description('The name of the storage account. e.g. st-et-za')
param storageAccountName string

@description('The SKU for the storage account. https://docs.microsoft.com/en-us/azure/templates/microsoft.storage/storageaccounts?pivots=deployment-language-bicep#sku')
param sku object = {
  name: 'Standard_LRS'
}

@allowed([
  'None'
  'SystemAssigned'
  'SystemAssigned,UserAssigned'
  'UserAssigned'
])
param identityType string = 'None'

param userAssignedIdentities object = {}

param allowBlobPublicAccess bool = true
param allowSharedKeyAccess bool = true

resource st 'Microsoft.Storage/storageAccounts@2022-05-01' = {
  name: storageAccountName
  location: location
  tags: tags
  sku: sku
  kind: 'StorageV2'
  identity: {
    type: identityType
    userAssignedIdentities: userAssignedIdentities
  }
  properties: {
    accessTier: 'Hot'
    allowBlobPublicAccess: allowBlobPublicAccess
    allowSharedKeyAccess: allowSharedKeyAccess
    defaultToOAuthAuthentication: false
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    isSftpEnabled: false
    largeFileSharesState: 'Enabled'
    minimumTlsVersion: 'TLS1_2'
    networkAcls: {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
      ipRules: []
      resourceAccessRules: []
      virtualNetworkRules: []
    }
    // publicNetworkAccess: 'Enabled'
    supportsHttpsTrafficOnly: true
  }
}

output storageAccountName string = st.name
output primaryBlobEndpoint string = st.properties.primaryEndpoints.blob
output secondaryBlobEndpoint string = st.properties.secondaryEndpoints.blob
