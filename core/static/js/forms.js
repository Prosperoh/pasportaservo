// @source: https://github.com/tejo-esperanto/pasportaservo/blob/master/core/static/js/forms.js
// @license magnet:?xt=urn:btih:0b31508aeb0634b347b8270c7bee4d411b5d4109&dn=agpl-3.0.txt AGPL v3


$(function() {

    $(window).bind('load', function() {
        var flasher = $('.alert.flyover');
        flasher.addClass('in');
        if (!flasher.hasClass('no-out')) {
            window.setTimeout(function () { flasher.addClass('out') }, 4000);
        }
    });

    /* constraint validation and localization */
    if (typeof $().localConstraint === "undefined") {
        $.fn.extend({ localConstraint: {} });
    }
    if (!$().localConstraint.hasOwnProperty(document.documentElement.lang)) {
        $.fn.localConstraint[document.documentElement.lang] = [];
    }

    $('.form-control, input[type="radio"], input[type="checkbox"], input[type="file"]')
    .blur(function(event, dontPropagate) {
        var $this = $(this);
        $this.addClass('form-touched');
        if (($this.is('[type="radio"]') || $this.is('[type="checkbox"]')) && !dontPropagate) {
            // update similarly-named siblings (for radio/checkbox groups)
            $('[name="'+$this.attr('name')+'"]').not($this).each(function() {
                $(this).triggerHandler('blur', true);
            });
        }
    }).on('input change invalid', function(event, dontPropagate) {
        var $this = $(this);
        var constraint_failed = false;
        var errors = [];
        var localui = $().localConstraint[document.documentElement.lang];

        this.setCustomValidity("");

        if (this.validity.valueMissing) {
            var value_error = "";
            if ($this.attr('type') && localui.hasOwnProperty("valueMissing__"+$this.attr('type').toLowerCase()))
                value_error = localui["valueMissing__"+$this.attr('type').toLowerCase()];
            else if ($this.is('select') && $this.prop('multiple'))
                value_error = localui["valueMissing__select__multiple"];
            else if ($this.is('select'))
                value_error = localui["valueMissing__select"];
            else if (!$this.is(':file') && !$this.is(':radio'))
                value_error = localui["valueMissing"];
            errors.push($this.data('error-required') || value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.typeMismatch) {
            var value_error = "";
            value_error = localui["typeMismatch__"+$this.attr('type').toLowerCase()+($this.prop('multiple') ? "__multiple" : "")];
            errors.push(value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.patternMismatch) {
            var value_error = "", value_label = undefined;
            value_error = localui["patternMismatch"];
            if (value_error) {
                value_label = $('label[for="'+this.getAttribute('id')+'"]').text().trim().toLowerCase();
                value_error = value_error.replace("%(datum)s", value_label || localui["patternMismatch__default"]);
            }
            errors.push($this.data('error-pattern') || value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.tooLong || this.validity.tooShort) {
            var value_error = "";
            value_error = localui[this.validity.tooLong ? "tooLong" : "tooShort"];
            if (value_error) {
                value_error = value_error.replace("%(limit)s", $this.attr(this.validity.tooShort ? 'minlength' : 'maxlength'))
                                         .replace("%(len)s", $this.val().length);
            }
            errors.push(value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.rangeUnderflow || this.validity.rangeOverflow) {
            var error_type = "", value_error = "", is_date = false, is_time = false;
            is_date = $this.filter('[type=date], [type=month], [type=week]').length;
            is_time = $this.filter('[type=datetime], [type=datetime-local], [type=time]').length;
            error_type = $this.filter('[min][max]').length ? "minmax" : (this.validity.rangeUnderflow ? "min" : "max");
            value_error = localui[error_type+(is_date ? "__date" : (is_time ? "__time" : ""))];
            if (value_error) {
                value_error = value_error.replace("%(min)s", ($this.attr('min') || "").replace('T', ' '))
                                         .replace("%(max)s", ($this.attr('max') || "").replace('T', ' '));
            }
            errors.push(value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.stepMismatch) {
            var error_type = "", value_error = "";
            if ($this.is('[type="number"]')) {
                var elem_step = !isNaN($this.attr('step')) ? Number($this.attr('step')) : 1,
                    elem_min = !isNaN($this.attr('min')) ? Number($this.attr('min')) : undefined,
                    elem_max = !isNaN($this.attr('max')) ? Number($this.attr('max')) : undefined;
                var elem_step_base = elem_min || 0, value_low, value_high;
                value_low = $this.val() - ($this.val() - elem_step_base) % elem_step;
                value_high = value_low + elem_step * (elem_min === undefined && value_low < 0 ? -1 : 1);
                if (elem_min !== undefined && value_low < elem_min) {
                    value_low = elem_min;
                    value_high = value_low;
                }
                if (elem_max !== undefined && value_high > elem_max) {
                    if (value_low > elem_max)
                        value_low = elem_max - (elem_max - elem_step_base) % elem_step;
                    value_high = value_low;
                }
                value_error = localui["stepMismatch__number"+(value_low == value_high ? "__one" : "")];
                if (value_error) {
                    value_error = value_error.replace("%(low)s", value_low).replace("%(high)s", value_high);
                }
            }
            else {
                value_error = localui["stepMismatch"];
            }
            errors.push(value_error || this.validationMessage);
            constraint_failed = true;
        }
        if (this.validity.badInput) {
            var value_error = "";
            if ($this.attr('type'))
                value_error = localui["badInput__"+$this.attr('type').toLowerCase()];
            if (!value_error)
                value_error = localui["badInput"];
            errors.push(value_error || this.validationMessage);
            constraint_failed = true;
        }
        if ($this.is('input[type="file"]') && !isNaN($this.attr('maxlength'))) {
            var data = event.originalEvent.target.files[0];
            if (data && data.size > Number($this.attr('maxlength'))) {
                errors.push($this.data('error-maxlength') || localui["max__file"] || "The file provided by you is too large.");
                constraint_failed = true;
            }
        }
        if ($this.is('input[type="password"]') && $($this.data('coupling')).length == 1) {
            var data = $($this.data('coupling')).val();
            if ($this.val() && $this.val() != data) {
                errors.push(localui["valueMismatch__password"] || "The two password fields do not match.");
                constraint_failed = true;
            }
        }

        if (constraint_failed) {
            this.setCustomValidity(errors.join("\n"));
            if (!$this.data('original-title')) {
                $this.data('original-title', $this.attr('title') || "[NULL]");
            }
            $this.attr('title', errors.join("\n"));
        }
        if (!constraint_failed) {
            this.setCustomValidity("");
            if ($this.data('original-title')) {
                $this.attr('title', $this.data('original-title') == "[NULL]" ? "" : $this.data('original-title'));
                $this.removeData('original-title');
                $this.removeAttr('original-title');
            }
            else if (!$this.attr('title')) {
                $this.attr('title', "");
            }
        }

        if (($this.is('[type="radio"]') || $this.is('[type="checkbox"]')) && !dontPropagate) {
            // update similarly-named siblings (for radio/checkbox groups)
            $('[name="'+$this.attr('name')+'"]').not($this).each(function() {
                $(this).triggerHandler('invalid', true);
            });
            return;
        }
    }).each(function() {
        var $this = $(this);
        // initialize localized error messages for this field
        this.checkValidity();
        $('#id_form_submit, #id_form_submit_alt').click(function() {
            // mark the field as visited on form submit
            $this.triggerHandler('blur', true);
        });
    });

    /* password fields coupling for client-side validation of correctly typed value */
    $('#id_password2').data('coupling', '#id_password1');
    $('#id_new_password2').data('coupling', '#id_new_password1');

    /* password strength meter for password input fields (registration, password change) */
    if (typeof $().pwstrength !== "undefined") {
        $.fn.pwstrength.localui = $.fn.pwstrength.localui || {};
        if (! $.fn.pwstrength.localui.hasOwnProperty(document.documentElement.lang))
            $.fn.pwstrength.localui[document.documentElement.lang] = [];
        
        var pwd_elements = $('#id_password1, #id_new_password1');
        pwd_elements.pwstrength({
            common: {
                zxcvbn: true,
                userInputs: ['#id_username', '#id_email', '#id_old_password'],
                zxcvbnTerms: ["pasporta", "servo", "saluton", "esperanto", "esperantist", "zamenhof", "pasvorto", "sekret"]
            },
            ui: {
                showVerdictsInsideProgressBar: true,
                progressBarMinPercentage: 15,
                progressBarEmptyPercentage: 0,
                colorClasses: ['danger', 'danger', 'danger', 'warning', 'success', 'success']
            }
        });
        if (pwd_elements.length > 0) {
            var options = pwd_elements.data('pwstrength-bootstrap');
            var t_fallback = options.i18n.t;
            options.i18n.t = function (key) {
                var dict = $.fn.pwstrength.localui[document.documentElement.lang];
                if (key in dict)
                    return dict[key];
                return t_fallback(key);
            };
            $('#id_username, #id_email').on('input', function () {
                pwd_elements.pwstrength("forceUpdate");
            });
        }
    }

    /* dynamic display of names ordering (changes with user input) */
    var updatePersonNamesExample = function() {
        var nameF = $('#id_first_name').val().trim(),
            nameL = $('#id_last_name').val().trim(),
            labelFL = $('label:has(#id_names_inversed_0)'),
            labelLF = $('label:has(#id_names_inversed_1)');
        $.each(labelFL[0].childNodes, function() {
            if (this.nodeType == Node.TEXT_NODE && this.textContent.trim()) {
                if (nameF && nameL)
                    this.textContent = nameF + " " + nameL;
                else
                    this.textContent = labelFL.data('blank-label');
            }
        });
        $.each(labelLF[0].childNodes, function() {
            if (this.nodeType == Node.TEXT_NODE && this.textContent.trim()) {
                if (nameF && nameL)
                    this.textContent = nameL + " " + nameF;
                else
                    this.textContent = labelLF.data('blank-label');
            }
        });
    };
    if ($('#id_first_name, #id_last_name').length != 2) {
        updatePersonNamesExample = function() {};
    }
    $('#id_first_name, #id_last_name').change(updatePersonNamesExample);

    +function() {
        $('ul.chosen-choices').addClass('form-control');
        $('.form-group .radio:has(.form-control-horizontal)')
            .removeClass('radio').addClass('radio-inline').children('label').css('font-weight', "normal")
            .each(function() {
                $(this).data('blank-label', $(this).text().trim());
            });
        updatePersonNamesExample();
    }();

    /* for mass mail form */
    $('#id_body').keyup(function() {
        $('#preview_body').html(marked($(this).val()));
        $('#id_preheader').val($(this).val().replace(/(\r\n|\n|\r)/gm,' ').slice(0,99)).keyup();
    }).keyup();

    $.each(['heading', 'subject', 'preheader'], function(i, element){
        $('#id_'+element).keyup(function() {
            $('#preview_'+element).html($(this).val());
        }).keyup();
    });

    $('#id_categories').change(function() {
        $('#id_test_email').closest('.form-group').toggle($(this).val() === "test");
    }).change();

    /* form submit/cancel keyboard shortcut key implementation */
    if ($('#id_form_submit, #id_form_cancel').is(function() { return $(this).data('kbdshortcut') })) {
        var shortcutY = ($('#id_form_submit').data('kbdshortcut') || "\0").charAt(0).toLowerCase();
        var shortcutN = ($('#id_form_cancel').data('kbdshortcut') || "\0").charAt(0).toLowerCase();
        $(window).bind('keydown', function(event) {
            if (event.isCommandKey()) {
                var pressedKey = String.fromCharCode(event.which).toLowerCase()
                if (pressedKey === shortcutY) {
                    event.preventDefault();
                    $('#id_form_submit').click();
                }
                if (pressedKey === shortcutN) {
                    event.preventDefault();
                    $('#id_form_cancel').click();
                }
            };
        });
    }
    
});


// @license-end
