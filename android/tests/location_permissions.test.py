"""Keep Android checkout location permissions limited to foreground access."""
import unittest
from pathlib import Path
import xml.etree.ElementTree as ET


class LocationPermissionsTest(unittest.TestCase):
    def test_checkout_can_request_precise_or_approximate_location(self):
        manifest = ET.parse(Path(__file__).parents[1] / "app/src/main/AndroidManifest.xml")
        name = "{http://schemas.android.com/apk/res/android}name"
        permissions = {element.get(name) for element in manifest.findall("uses-permission")}
        self.assertIn("android.permission.ACCESS_COARSE_LOCATION", permissions)
        self.assertIn("android.permission.ACCESS_FINE_LOCATION", permissions)
        self.assertNotIn("android.permission.ACCESS_BACKGROUND_LOCATION", permissions)


if __name__ == "__main__":
    unittest.main()