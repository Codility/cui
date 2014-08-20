'''

    Copyright (C) 2014 Codility Limited. <https://codility.com>

    This file is part of Candidate User Interface (CUI).

    CUI is free software: you can redistribute it and/or modify
    it under the terms of the GNU Lesser General Public License as published
    by the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version accepted in a public statement
    by Codility Limited.

    CUI is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Lesser General Public License for more details.

    You should have received a copy of the GNU Lesser General Public License
    along with CUI.  If not, see <http://www.gnu.org/licenses/>.

'''


import os
import sys
import json

from django.test.testcases import LiveServerTestCase, TestCase
from django.test.client import Client
from django.core.urlresolvers import reverse
from django.utils.http import urlquote

from selenium import webdriver
from selenium.webdriver.support.ui import WebDriverWait
from pyvirtualdisplay.smartdisplay import SmartDisplay


class CuiTestCase(TestCase):
    def test_render(self):
        '''Check whether the template renders'''
        client = Client()
        response = client.get(reverse('cui_test'))
        self.assertEqual(response.status_code, 200)
        response = client.get(reverse('cui_local'))
        self.assertEqual(response.status_code, 200)


class SeleniumReporter(object):
    def __init__(self, driver, out):
        self.driver = driver
        self.out = out
        self.indent = 0
        self.num_tests = 0
        self.num_passed = 0
        self.failures = []
        self.any_specs = False
        self.not_printed_suites = []

    def on_jasmine_started(self, options):
        pass

    def on_jasmine_done(self, _):
        pass

    def on_suite_started(self, suite):
        self.not_printed_suites.append(suite)

    def on_suite_done(self, suite):
        if len(self.not_printed_suites) > 0 and self.not_printed_suites[-1]['id'] == suite['id']:
            self.not_printed_suites.pop()
        else:
            self.indent -= 1

    def on_spec_started(self, spec):
        pass

    def on_spec_done(self, spec):
        self.any_specs = True

        self.num_tests += 1
        print_info = True

        if spec['status'] == "passed":
            self.num_passed += 1
            color = "green"
        elif spec['status'] == "failed":
            self.failures.append(spec)
            color = "red"
        elif spec['status'] == "disabled":
            self.num_tests -= 1
            print_info = False
        else:
            raise Exception("Unknonw test status: '{}'".format(spec['status']))

        if print_info:
            for suite in self.not_printed_suites:
                self.write("{}\n".format(self.style(suite['description'], "bold")))
                self.indent += 1
            self.not_printed_suites = []

            self.write("{} ... {}\n".format(spec['description'], self.style(spec['status'], color)))

    def style(self, string, *styles):
        codes = {
            'black': '\x1B[30m',
            'red': '\x1B[31m',
            'green': '\x1B[32m',
            'yellow': '\x1B[33m',
            'blue': '\x1B[34m',
            'magenta': '\x1B[35m',
            'cyan': '\x1B[36m',
            'white': '\x1B[37m',
            'backblack': '\x1B[40m',
            'backred': '\x1B[41m',
            'backgreen': '\x1B[42m',
            'backyellow': '\x1B[43m',
            'backblue': '\x1B[44m',
            'backmagenta': '\x1B[45m',
            'backcyan': '\x1B[46m',
            'backwhite': '\x1B[47m',
            'bold': '\x1B[1m',
            'none': '\x1B[0m',
            'underline': '\x1B[4m'
        }

        if not self.out.isatty():
            return string

        for style in styles:
            string = codes[style] + string
        string += codes['none']
        return string

    def write(self, message, indent=True):
        if indent:
            self.out.write('    ' * self.indent)
        self.out.write(message)
        self.out.flush()

    def wait_until_expr(self, expr, timeout=60):
        WebDriverWait(self.driver, timeout).until(
            lambda driver: driver.execute_script('return (%s)' % expr))

    def print_failure(self, fail):
        self.write(self.style(fail['fullName'], "blue", "bold") + "\n")
        for e in fail['failedExpectations']:
            self.indent = 1

            if e['expected'] != '':
                self.write("\n")
                self.write("    {}: {}\n".format(
                    self.style("expected", "yellow"),
                    json.dumps(e['expected'])))
                self.write("    {}:   {}\n".format(
                    self.style("actual", "yellow"),
                    json.dumps(e['actual'])))

            self.write("\n")

            stack = e['stack'].split('\n')
            stack_height = len(stack) - 1
            self.write(self.style(stack[0], "bold") + "\n")
            for i in range(1, min(10, stack_height) + 1):
                self.write(stack[i] + "\n")
            if stack_height > 10:
                self.write("{} more...\n".format(stack_height - 10))
            self.write("\n\n")

            self.indent = 0

    def run(self):
        self.wait_until_expr('window.seleniumReporter.isFinished()')
        events = self.driver.execute_script('return window.seleniumReporter.getAllEvents();')
        for event in events:
            handler = getattr(self, 'on_' + event['name'])
            handler(event['data'])

        if not self.any_specs:
            self.write(self.style('\nDidn\'t found any tests, probably syntax error in tests.js\n\n', "red", "bold"))
            return False

        passed_tests = self.num_tests == self.num_passed
        if passed_tests:
            color = "green"
        else:
            color = "red"
        self.write(self.style('\n    Passed {}/{} tests.\n\n', color, "bold").format(self.num_passed, self.num_tests))

        for failure in self.failures:
            self.print_failure(failure)

        return passed_tests


class CuiJsTestCase(LiveServerTestCase):
    def setUp(self):
        if not os.environ.get('SHOW_SELENIUM'):
            self.display = SmartDisplay(visible=0, size=(1024, 768))
            self.display.start()

        remote_selenium = os.environ.get('REMOTE_SELENIUM')
        if not remote_selenium:
            self.driver = webdriver.Firefox()
        else:
            self.driver = webdriver.Remote(
                command_executor=remote_selenium,
                desired_capabilities={
                    'browserName': 'unknown',
                    'javascriptEnabled': True,
                    'platform': 'ANY',
                    'version': ''
                }
            )

    def tearDown(self):
        if hasattr(self, 'driver'):
            self.driver.quit()
        if hasattr(self, 'display'):
            self.display.stop()

    def wait_until_expr(self, expr, timeout=60):
        WebDriverWait(self.driver, timeout).until(
            lambda driver: driver.execute_script('return (%s)' % expr))

    def test(self):
        sys.stderr.write('\n\nRunning candidate UI unit tests...\n')
        sys.stderr.flush()

        tests_url = self.live_server_url + reverse('cui_test')
        jasmine_spec = os.environ.get('JASMINE_SPEC')
        if jasmine_spec:
            tests_url += "?spec={}".format(urlquote(jasmine_spec))
        self.driver.get(tests_url)

        self.wait_until_expr('window.seleniumReporter')

        reporter = SeleniumReporter(self.driver, sys.stderr)
        self.assertTrue(reporter.run(), 'JS tests failed. See full report on stderr')
