# Tinloof Templates

- **Sanity base template** can be found at the [main](https://github.com/tinloof/templates/tree/main) branch
- **Sanity i18n template** can be found at the [i18n](https://github.com/tinloof/templates/tree/i18n) branch
- **Shopify template** can be found at the [shopify](https://github.com/tinloof/templates/tree/shopify) branch

## Branch Naming and Deployment Policy  

To ensure smooth Vercel builds, each template has its own Vercel project. This setup ensures the correct environment variables are applied during the build process.  

### Branch Naming Conventions  

All new branches **must** follow these naming patterns:  

- **Base Template:** `base/[branch-name]`  
- **Base i18n Template:** `base-i18n/[branch-name]`  
- **Shopify i18n Template:** `i18n-shopify/[branch-name]`  

❌ **Branches with other naming patterns will have their builds cancelled.**  

### Why Builds Are Cancelled  

Each Vercel project includes an ignored build step script that validates branch names. For example, the **Base Template** uses the following script:  
```bash
case "$VERCEL_GIT_COMMIT_REF" in main|base/*) exit 0 ;; *) exit 1 ;; esac
```
If your branch name doesn’t match the expected pattern, the build will be automatically stopped.

### Manual Deployment

You can still deploy your branch manually if needed, even if the automated build fails. Use the Vercel dashboard or CLI to trigger a manual deployment.

### Vercel Project Names

Each template corresponds to a specific Vercel project. Use the following project names to link and pull the correct environment variables via the Vercel CLI:

- **Base Template**: base-template
- **Base i18n Template**: i18n-template
- **Shopify i18n Template**: shopify-template
