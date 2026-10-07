import unittest

from minari.storage.remotes import get_cloud_storage


class ObservationDownloadTests(unittest.TestCase):
    def test_hugging_face_downloader_is_installed(self):
        # Fresh installs must support the same download path as cached datasets.
        storage = get_cloud_storage(remote_path="hf://farama-minari")
        self.assertTrue(callable(storage.download_dataset))


if __name__ == "__main__":
    unittest.main()
