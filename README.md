
# CUI (Candidate User Interface)

[![Build Status](https://travis-ci.org/Codility/cui.svg?branch=master)](https://travis-ci.org/Codility/cui)

This is [Codility's](https://codility.com/) candidate interface. It's provided
as a Django application ready for stand-alone development.


## Installation

Install Python packages (from requirements.txt):

    pip install -r requirements.txt

Install Ruby packages (from Gemfile):

    gem install bundler
    bundle install

For running the tests with Selenium, you need Xvfb and Firefox.

Under Ubuntu, you can install them using:

    sudo apt-get install xvfb firefox


## Running

You can run CUI using a standard Django development server:

    python manage.py runserver localhost:8001

Run the unit tests (using Selenium):

    python manage.py test

Run the unit tests (in your browser):

    http://localhost:8001/test/

Run against a mock in-browser server:

    http://localhost:8001/local/

To see browser while running selenium tests you have to set `SHOW_SELENIUM`
environment variable.

If you would like to use driver other than Firefox for selenium tests you can
use selenium remove web driver and specify remote address by `REMOTE_SELENIUM`
environment variable. For example running tests using [PhantomJS](http://phantomjs.org/):

    phantomjs --webdriver=22222 < /dev/null > /dev/null &
    REMOTE_SELENIUM="http://localhost:22222" python manage.py test


## License

CUI is distributed under the terms of
**GNU Lesser General Public License version 3** (LGPLv3).
See files COPYING and COPYING.LESSER for details.


## Contact

By e-mail:

    support@codility.com

By phone:

    +44-208-970-78-68
    +1-855-888-5880

By postal mail:

    Codility Polska
    Długa 44/50
    Poddasze A
    00-241 Warszawa
    Poland
