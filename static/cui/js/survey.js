/*!

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

*/

function surveyShow(dialog_element) {
    var survey_placeholder = $('.survey_placeholder', dialog_element);
    if(survey_placeholder.size() == 1) {
        var survey = $('#survey');
        survey[0].parentNode.removeChild(survey[0]);
        survey_placeholder.replaceWith(survey);
        survey.show();
    }
}

function surveyFilled() {
    var fields = $('#survey_form').serializeArray();
    for (var i = 0; i < fields.length; ++i) {
        if (fields[i].value !== '')
            return true;
    }
    return false;
}

function surveySubmit(url, callback) {
    var form = $('#survey_form');
    var form_data = form.serialize();
    $.ajax({
        type: 'POST',
        url: url,
        data: form_data,
        timeout: 1000,
        complete: callback
    });
}
