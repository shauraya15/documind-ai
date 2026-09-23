import requests
from azure.identity import DefaultAzureCredential
from azure.storage.blob import BlobServiceClient

STORAGE_ACCOUNT = "documinddocs1517"
CONTAINER = "product-docs"

DOCS = {
    "fastapi": {
        "first-steps": "https://fastapi.tiangolo.com/tutorial/first-steps/",
        "path-parameters": "https://fastapi.tiangolo.com/tutorial/path-params/",
        "query-parameters": "https://fastapi.tiangolo.com/tutorial/query-params/",
        "request-body": "https://fastapi.tiangolo.com/tutorial/body/",
        "dependencies": "https://fastapi.tiangolo.com/tutorial/dependencies/",
    },
    "react": {
        "learn": "https://react.dev/learn",
        "describing-ui": "https://react.dev/learn/describing-the-ui",
        "adding-interactivity": "https://react.dev/learn/adding-interactivity",
        "managing-state": "https://react.dev/learn/managing-state",
        "escape-hatches": "https://react.dev/learn/escape-hatches",
    },
    "docker": {
        "get-started": "https://docs.docker.com/get-started/",
        "overview": "https://docs.docker.com/get-started/docker-overview/",
        "images": "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-an-image/",
        "building-images": "https://docs.docker.com/get-started/docker-concepts/building-images/",
        "compose": "https://docs.docker.com/get-started/docker-concepts/the-basics/what-is-docker-compose/",
    },
    "kubernetes": {
        "concepts": "https://kubernetes.io/docs/concepts/",
        "pods": "https://kubernetes.io/docs/concepts/workloads/pods/",
        "deployments": "https://kubernetes.io/docs/concepts/workloads/controllers/deployment/",
        "services": "https://kubernetes.io/docs/concepts/services-networking/service/",
        "configmaps": "https://kubernetes.io/docs/concepts/configuration/configmap/",
    },
    "postgresql": {
        "tutorial": "https://www.postgresql.org/docs/current/tutorial.html",
        "sql": "https://www.postgresql.org/docs/current/tutorial-sql.html",
        "tables": "https://www.postgresql.org/docs/current/tutorial-table.html",
        "select": "https://www.postgresql.org/docs/current/tutorial-select.html",
        "joins": "https://www.postgresql.org/docs/current/tutorial-join.html",
    },
    "azure": {
        "architecture": "https://learn.microsoft.com/en-us/azure/architecture/",
        "blob-storage": "https://learn.microsoft.com/en-us/azure/storage/blobs/",
        "ai-search": "https://learn.microsoft.com/en-us/azure/search/search-what-is-azure-search",
        "vector-search": "https://learn.microsoft.com/en-us/azure/search/vector-search-overview",
        "agentic-retrieval": "https://learn.microsoft.com/en-us/azure/search/get-started-portal-agentic-retrieval",
    },
}


def main():
    credential = DefaultAzureCredential()

    account_url = f"https://{STORAGE_ACCOUNT}.blob.core.windows.net"

    service = BlobServiceClient(
        account_url=account_url,
        credential=credential,
    )

    container = service.get_container_client(CONTAINER)

    uploaded = 0

    for category, documents in DOCS.items():
        for name, url in documents.items():

            print(f"Downloading: {url}")

            response = requests.get(url, timeout=30)
            response.raise_for_status()

            # Store the source HTML as Markdown-compatible text.
            content = response.text

            blob_name = f"{category}/{name}.html"

            container.upload_blob(
                name=blob_name,
                data=content.encode("utf-8"),
                overwrite=True,
            )

            print(f"Uploaded: {blob_name}")
            uploaded += 1

    print(f"\nUploaded {uploaded} documents.")


if __name__ == "__main__":
    main()