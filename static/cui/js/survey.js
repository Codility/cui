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
