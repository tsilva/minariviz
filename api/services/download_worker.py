"""Isolate downloads so the API can enforce a deadline and file-size ceiling."""

import resource
import sys

from huggingface_hub import hf_hub_download


if __name__ == "__main__":
    repository, filename, revision, directory, max_bytes = sys.argv[1:]
    resource.setrlimit(resource.RLIMIT_FSIZE, (int(max_bytes), int(max_bytes)))
    hf_hub_download(
        repo_id=repository,
        repo_type="dataset",
        filename=filename,
        revision=revision,
        local_dir=directory,
        token=False,
    )
