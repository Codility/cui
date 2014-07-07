
# CUI (Candidate Interface)

This is [Codility's](http://codility.com/) candidate interface. It's provided
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
