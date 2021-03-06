/**
 * Loads a template from a string.
 *
 * <pre>
 * {{ include(template_from_string("Hello {{ name }}")) }}
 * </pre>
 *
 * @param {TwingEnvironment} env A TwingEnvironment instance
 * @param {string} template A template as a string or object implementing toString()
 * @param {string} name An optional name for the template to be used in error messages
 *
 * @returns TwingTemplate
 */
import {TwingEnvironment} from "../../../environment";
import {TwingTemplate} from "../../../template";

export function templateFromString(env: TwingEnvironment, template: string, name: string = null): TwingTemplate {
    return env.createTemplate(template, name);
}
