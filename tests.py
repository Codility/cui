
from django.test.testcases import LiveServerTestCase
from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from django.core.urlresolvers import reverse

import sys

class CUITestCase(LiveServerTestCase):
    def setUp(self):
        self.driver = webdriver.PhantomJS()

    def tearDown(self):
        if hasattr(self, 'driver'):
            self.driver.quit()

    def wait_until_expr(self, expr, timeout=60):
        WebDriverWait(self.driver, timeout).until(
            lambda driver: driver.execute_script('return (%s)' % expr))

    def test(self):
        sys.stderr.write('\n\nRunning candidate UI unit tests...\n')
        sys.stderr.flush()
        self.driver.get(self.live_server_url+reverse('cui_test'))

        self.wait_until_expr('window.jsApiReporter !== undefined && window.jsApiReporter.finished')
        specs = self.driver.execute_script('return window.jsApiReporter.specs()')
        self.assertTrue(len(specs) > 0, 'No test results found! The tests probably contain syntax errors.')

        passed = True
        for spec in specs:
            sys.stderr.write('  %s ... %s\n' % (spec['fullName'], spec['status']))
            if spec['status'] != 'passed':
                passed = False
            for exp in spec['failedExpectations']:
                sys.stderr.write('    %s\n' % exp['message'])
        sys.stderr.write('Access full report at %s\n\n' % reverse('cui_test'))
        sys.stderr.flush()

        self.assertTrue(passed, 'JS tests failed. See full report on stderr')
