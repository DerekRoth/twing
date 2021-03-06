import * as tape from 'tape';
import {TwingLoaderRelativeFilesystem as TwingLoaderFilesystem} from "../../../../../../src/lib/loader/relative-filesystem";
import {TwingErrorLoader} from "../../../../../../src/lib/error/loader";
import {TwingSource} from "../../../../../../src/lib/source";
import {TwingEnvironmentNode} from "../../../../../../src/lib/environment/node";

const nodePath = require('path');
const sinon = require('sinon');

let fixturesPath = nodePath.resolve('test/tests/unit/lib/loader/filesystem/fixtures');

let securityTests = [
    ["AutoloaderTest\0.php"],
    ['..\\AutoloaderTest.php'],
    ['..\\\\\\AutoloaderTest.php'],
    ['../AutoloaderTest.php'],
    ['..////AutoloaderTest.php'],
    ['./../AutoloaderTest.php'],
    ['.\\..\\AutoloaderTest.php'],
    ['././././././../AutoloaderTest.php'],
    ['.\\./.\\./.\\./../AutoloaderTest.php'],
    ['foo/../../AutoloaderTest.php'],
    ['foo\\..\\..\\AutoloaderTest.php'],
    ['foo/../bar/../../AutoloaderTest.php'],
    ['foo/bar/../../../AutoloaderTest.php'],
    ['filters/../../AutoloaderTest.php'],
    ['filters//..//..//AutoloaderTest.php'],
    ['filters\\..\\..\\AutoloaderTest.php'],
    ['filters\\\\..\\\\..\\\\AutoloaderTest.php'],
    ['filters\\//../\\/\\..\\AutoloaderTest.php'],
    ['/../AutoloaderTest.php'],
];

let arrayInheritanceTests = new Map([
    ['valid array inheritance', ['array_inheritance_valid_parent.html.twig']],
    ['array inheritance with null first template', ['array_inheritance_null_parent.html.twig']],
    ['array inheritance with empty first template', ['array_inheritance_empty_parent.html.twig']],
    ['array inheritance with non-existent first template', ['array_inheritance_nonexistent_parent.html.twig']]
]);

tape('loader filesystem', (test) => {
    test.test('getSourceContext', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve('test/tests/integration/fixtures', path);
        };

        let loader = new TwingLoaderFilesystem();

        try {
            loader.getSourceContext('errors/index.html', null);
        } catch (err) {
            test.true(err instanceof TwingErrorLoader);
            test.same(err.getMessage(), `Unable to find template "errors/index.html".`);
        }

        let source = loader.getSourceContext('errors/index.html', new TwingSource('', '', resolvePath('foo.html')));

        test.same(source.getName(), resolvePath('errors/index.html'));
        test.same(source.getPath(), source.getName());

        source = loader.getSourceContext('../errors/index.html', new TwingSource('', '', resolvePath('foo/bar.html')));

        test.same(source.getName(), resolvePath('errors/index.html'));
        test.same(source.getPath(), source.getName());

        try {
            loader.getSourceContext('foo', new TwingSource('', '', 'foo/bar/index.html'));
        } catch (err) {
            test.true(err instanceof TwingErrorLoader);
            test.same(err.getMessage(), `Unable to find template "foo/bar/foo".`);
        }

        test.test('use error cache on subsequent calls', (test) => {
            let validateNameSpy = sinon.spy(loader, 'validateName');

            try {
                loader.getSourceContext('foo', new TwingSource('', ''));
            } catch (e) {

            }

            try {
                loader.getSourceContext('foo', new TwingSource('', ''));
            } catch (e) {

            }

            test.same(validateNameSpy.callCount, 1);

            test.end();
        });

        test.end();
    });

    test.test('security', (test) => {
        for (let securityTest of securityTests) {
            let template = securityTest[0];
            let loader = new TwingLoaderFilesystem();

            try {
                loader.getCacheKey(template, null);

                test.fail();
            } catch (e) {
                test.notSame(e.message, 'Unable to find template', e.message);
            }
        }

        test.end();
    });

    test.test('findTemplate', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve(fixturesPath, path);
        };

        let CustomLoader = class extends TwingLoaderFilesystem {
            findTemplate(name: string, throw_: boolean, from: TwingSource) {
                return super.findTemplate(name, throw_, from);
            }
        };

        let loader = new CustomLoader();

        test.same(loader.findTemplate(resolvePath('named/index.html'), false, undefined), resolvePath('named/index.html'));
        test.same(loader.findTemplate(resolvePath('named'), false, undefined), null);

        try {
            loader.findTemplate(resolvePath('named'), undefined, undefined);
        } catch (err) {
            test.true(err instanceof TwingErrorLoader);
            test.same(err.getMessage(), `Unable to find template "${resolvePath('named')}".`);
        }

        test.test('find-template-with-error-cache', (test) => {
            loader.findTemplate('non-existing', false, null);

            let spy = sinon.spy(loader, 'validateName');

            test.same(loader.findTemplate('non-existing', false, null), null);
            test.same(spy.callCount, 0);

            spy.restore();

            test.end();
        });

        test.end();
    });

    test.test('find-template-with-cache', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve(fixturesPath, path);
        };

        let loader = new TwingLoaderFilesystem();
        let namedSource = loader.getSourceContext('named/index.html', new TwingSource('', '', resolvePath('index.html'))).getCode();

        test.same(namedSource, "named path\n");

        test.end();
    });

    test.test('load-template-and-render-block-with-cache', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve(fixturesPath, path);
        };

        let loader = new TwingLoaderFilesystem();

        let twing = new TwingEnvironmentNode(loader);

        let template = twing.loadTemplate('../themes/theme1/blocks.html.twig', 0, new TwingSource('', '', resolvePath('normal/index.html')));

        test.same(template.renderBlock('b1', {}), 'block from theme 1');

        template = twing.loadTemplate('../themes/theme3/blocks.html.twig', 0, new TwingSource('', '', resolvePath('normal/index.html')));

        test.same(template.renderBlock('b2', {}), 'block from theme 3');

        test.end();
    });

    test.test('array-inheritance', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve(nodePath.join(fixturesPath, 'inheritance'), path);
        };

        for (let [testMessage, arrayInheritanceTest] of arrayInheritanceTests) {
            let templateName = resolvePath(arrayInheritanceTest[0]);
            let loader = new TwingLoaderFilesystem();
            let twing = new TwingEnvironmentNode(loader);
            let template = twing.loadTemplate(templateName);

            test.same(template.renderBlock('body', {}), 'VALID Child', testMessage);
        }

        test.end();
    });

    test.test('should normalize template name', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve(fixturesPath, path);
        };

        let loader = new TwingLoaderFilesystem();

        let names = [
            'named/index.html',
            'named//index.html',
            'named///index.html',
            '../fixtures/named/index.html',
            '..//fixtures//named//index.html',
            '..///fixtures///named///index.html',
            'named\\index.html',
            'named\\\\index.html',
            'named\\\\\\index.html',
            '..\\fixtures\\named\\index.html',
            '..\\\\fixtures\\\\named\\\\index.html',
            '..\\\\\\fixtures\\named\\\\\\index.html',
        ];

        for (let name of names) {
            test.same(loader.getSourceContext(name, new TwingSource('', '', resolvePath('foo.html'))), new TwingSource('named path\n', resolvePath('named/index.html'), resolvePath('named/index.html')));
        }

        test.end();
    });

    test.test('exists', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve('test/tests/unit/lib/loader/filesystem/fixtures', path);
        };

        let loader = new TwingLoaderFilesystem();
        let source = new TwingSource('', '', resolvePath('index.html'));

        test.equals(loader.exists('normal/index.html', source), true);
        test.equals(loader.exists('foo', source), false);

        loader.getSourceContext('normal/index.html', source);

        let spy = sinon.spy(loader, 'findTemplate');
        let exists = loader.exists('normal/index.html', source);

        test.equals(exists, true);
        test.same(spy.callCount, 0);

        test.equals(loader.exists('normal/index.html', null), false);
        test.equals(loader.exists("foo\0.twig", source), false);
        test.equals(loader.exists('@foo', source), false);
        test.equals(loader.exists('foo', source), false);
        test.equals(loader.exists('@foo/bar.twig', source), false);

        test.end();
    });

    test.test('isFresh', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve('test/tests/unit/lib/loader/filesystem/fixtures', path);
        };

        let loader = new TwingLoaderFilesystem();
        let source = new TwingSource('', '', resolvePath('index.html'));

        test.true(loader.isFresh('normal/index.html', new Date().getTime(), source));

        test.end();
    });

    test.test('resolve', (test) => {
        let resolvePath = (path: string) => {
            return nodePath.resolve('test/tests/unit/lib/loader/filesystem/fixtures', path);
        };

        let loader = new TwingLoaderFilesystem();
        let source = new TwingSource('', '', resolvePath('index.html'));

        test.same(loader.resolve('normal/index.html', source), resolvePath('normal/index.html'));
        test.same(loader.resolve(resolvePath('normal/index.html'), null), resolvePath('normal/index.html'));

        test.end();
    });

    test.end();
});
