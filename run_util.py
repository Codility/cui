
from django.test.simple import DjangoTestSuiteRunner
import unittest

import tests


class CUITestRunner(DjangoTestSuiteRunner):
    '''Test runner for the stand-alone CUI app.'''

    def build_suite(self, *args, **kwargs):
        suite = unittest.TestSuite()
        suite.addTest(unittest.defaultTestLoader.loadTestsFromModule(tests))
        return suite
