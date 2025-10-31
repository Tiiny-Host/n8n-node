# n8n-nodes-tiiny-host

This is an n8n community node that lets you use [Tiiny Host](https://tiiny.host) in your n8n workflows.

Tiiny Host is the simplest way to share your static website. Upload your HTML, PDF, or ZIP files and get an instant live link in seconds!

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### Community Nodes (Recommended)

1. Go to **Settings > Community Nodes** in n8n
2. Select **Install a community node**
3. Enter `n8n-nodes-tiiny-host` in the npm Package Name
4. Agree to the risks and select **Install**

After installing the node, you can use it like any other node. n8n displays the node in search results in the **Nodes** panel.

### Manual Installation

To get started, install the package in your n8n root directory:

```bash
npm install n8n-nodes-tiiny-host
```

For Docker-based deployments, add the following line before the font installation command in your [n8n Dockerfile](https://github.com/n8n-io/n8n/blob/master/docker/images/n8n/Dockerfile):

```dockerfile
RUN cd /usr/local/lib/node_modules/n8n && npm install n8n-nodes-tiiny-host
```

## Operations

The Tiiny Host node supports the following operations:

### Create Site

- Upload HTML, PDF, or ZIP files to create a new site
- Optionally set a custom subdomain
- Enable password protection for your site
- Choose from available domain suffixes

### Update Site

- Update an existing site with new files
- Maintains the same URL while replacing the content
- Automatically removes old files before uploading new ones
- Update password protection settings

### Delete Site

- Permanently delete a site from Tiiny Host
- Removes all associated files and data

## Credentials

To use this node, you need a Tiiny Host API key. You can obtain your API key from your [Tiiny Host account settings](https://tiiny.host/manage/accoun).

### Setting up credentials in n8n:

1. Go to **Credentials** in n8n
2. Click **Create New** and select **Tiiny API**
3. Enter your API key from Tiiny Host
4. Click **Save**

## Compatibility

- Minimum n8n version: **1.0.0**
- Tested against n8n version: **1.68.0**

## Usage

### Example: Upload a Website

1. Add a **Read Binary File** node to read your HTML file or ZIP archive
2. Add the **Tiiny** node
3. Select the **Create Site** operation
4. Configure:
   - **Binary Property**: `data` (or your binary property name)
   - **Subdomain** (optional): Your desired subdomain
   - **Domain Suffix**: Select from available options
   - **Password Protected**: Enable if needed
5. Execute the workflow
6. The node will return the live URL of your site

### Example: Update an Existing Site

1. Get the binary file you want to upload (using **Read Binary File** or **HTTP Request** node)
2. Add the **Tiiny** node
3. Select the **Update Site** operation
4. Configure:
   - **Site Link**: The full URL of the site to update (e.g., `my-site.tiiny.site`)
   - **Binary Property**: The name of the binary property containing your file
   - **Password Protected**: Update protection settings if needed
5. Execute the workflow
6. Your site will be updated with the new content

### Example: Delete a Site

1. Add the **Tiiny** node
2. Select the **Delete Site** operation
3. Configure:
   - **Site Link**: The full URL of the site to delete (e.g., `my-site.tiiny.site`)
4. Execute the workflow
5. The site will be permanently deleted

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Tiiny Host](https://tiiny.host)
- [Tiiny Host Documentation](https://tiiny.host/docs)
- [Tiiny Host API Documentation](https://tiiny.host/api)

## Support

If you have any issues or questions:

- Check the [n8n forum](https://community.n8n.io/)
- Visit [Tiiny Host support](https://tiiny.host/support)
- Open an issue on [GitHub](https://github.com/Tiiny-Host/n8n-node/issues)

## License

[MIT](LICENSE.md)

## Version History

### 0.1.0

- Initial release
- Create, Update, and Delete site operations
- API key authentication
- Password protection support
- Custom subdomain and domain suffix support
