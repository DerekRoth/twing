import * as tape from 'tape';
import {TwingNodeExpressionConstant} from "../../../../../../src/lib/node/expression/constant";
import {TwingNodeText} from "../../../../../../src/lib/node/text";
import {TwingNode, TwingNodeType} from "../../../../../../src/lib/node";
import {TwingNodeModule} from "../../../../../../src/lib/node/module";
import {TwingSource} from "../../../../../../src/lib/source";
import {MockCompiler} from "../../../../../mock/compiler";
import {TwingNodeImport} from "../../../../../../src/lib/node/import";
import {TwingNodeExpressionAssignName} from "../../../../../../src/lib/node/expression/assign-name";
import {TwingNodeSet} from "../../../../../../src/lib/node/set";
import {TwingNodeExpressionConditional} from "../../../../../../src/lib/node/expression/conditional";
import {MockLoader} from "../../../../../mock/loader";
import {MockEnvironment} from "../../../../../mock/environment";

tape('node/module', (test) => {
    test.test('constructor', (test) => {
        let body = new TwingNodeText('foo', 1, 1, null);
        let parent = new TwingNodeExpressionConstant('layout.twig', 1, 1);
        let blocks = new TwingNode();
        let macros = new TwingNode();
        let traits = new TwingNode();
        let source = new TwingSource('{{ foo }}', 'foo.twig');
        let node = new TwingNodeModule(body, parent, blocks, macros, traits, [], source);

        test.same(node.getNode('body'), body);
        test.same(node.getNode('blocks'), blocks);
        test.same(node.getNode('macros'), macros);
        test.same(node.getNode('parent'), parent);
        test.same(node.getTemplateName(), source.getName());
        test.same(node.getType(), TwingNodeType.MODULE);
        test.same(node.getTemplateLine(), 1);
        test.same(node.getTemplateColumn(),1);

        test.end();
    });

    test.test('compile', (test) => {
        let compiler = new MockCompiler();

        test.test('basic', (test) => {
            let body = new TwingNodeText('foo', 1, 1);
            let parent = null;
            let blocks = new TwingNode();
            let macros = new TwingNode();
            let traits = new TwingNode();
            let source = new TwingSource('{{ foo }}', 'foo.twig');
            let node = new TwingNodeModule(body, parent, blocks, macros, traits, [], source);

            test.same(compiler.compile(node).getSource(), `module.exports = (TwingTemplate) => {
    return new Map([
        [0, class extends TwingTemplate {
            constructor(env) {
                super(env);

                this.source = this.getSourceContext();
                this.macros = new this.Context();
                let macros = new this.Context();

                this.parent = false;

                this.blocks = new Map([
                ]);
            }

            doDisplay(context, blocks = new Map()) {
                let macros = this.macros.clone();
                this.echo(\`foo\`);
            }

            getTemplateName() {
                return \`foo.twig\`;
            }

            getSourceContext() {
                return new this.Source(\`\`, \`foo.twig\`, \`\`);
            }
        }],
    ]);
};`);

            test.end();
        });

        test.test('with parent', (test) => {
            let import_ = new TwingNodeImport(new TwingNodeExpressionConstant('foo.twig', 1, 1), new TwingNodeExpressionAssignName('macro', 1, 1), 2, 1);

            let bodyNodes = new Map([
                [0, import_]
            ]);

            let body = new TwingNode(bodyNodes);
            let extends_ = new TwingNodeExpressionConstant('layout.twig', 1, 1);

            let blocks = new TwingNode();
            let macros = new TwingNode();
            let traits = new TwingNode();
            let source = new TwingSource('{{ foo }}', 'foo.twig');

            let node = new TwingNodeModule(body, extends_, blocks, macros, traits, [], source);

            test.same(compiler.compile(node).getSource(), `module.exports = (TwingTemplate) => {
    return new Map([
        [0, class extends TwingTemplate {
            constructor(env) {
                super(env);

                this.source = this.getSourceContext();
                this.macros = new this.Context();
                let macros = new this.Context();

                this.parent = this.loadTemplate(\`layout.twig\`, \`foo.twig\`, 1);

                this.blocks = new Map([
                ]);
            }

            doGetParent(context) {
                return \`layout.twig\`;
            }

            doDisplay(context, blocks = new Map()) {
                let macros = this.macros.clone();
                macros.proxy[\`macro\`] = this.macros.proxy[\`macro\`] = this.loadTemplate(\`foo.twig\`, \`foo.twig\`, 2);
                this.parent.display(context, this.merge(this.blocks, blocks));
            }

            getTemplateName() {
                return \`foo.twig\`;
            }

            isTraitable() {
                return false;
            }

            getSourceContext() {
                return new this.Source(\`\`, \`foo.twig\`, \`\`);
            }
        }],
    ]);
};`);

            test.end();
        });

        test.test('with conditional parent, set body and debug', (test) => {
            let setNames = new Map([
                [0, new TwingNodeExpressionAssignName('foo', 4, 1)]
            ]);

            let setValues = new Map([
                [0, new TwingNodeExpressionConstant('foo', 4, 1)]
            ]);

            let set = new TwingNodeSet(false, new TwingNode(setNames), new TwingNode(setValues), 4, 1);

            let bodyNodes = new Map([
                [0, set]
            ]);

            let body = new TwingNode(bodyNodes);
            let extends_ = new TwingNodeExpressionConditional(
                new TwingNodeExpressionConstant(true, 2, 1),
                new TwingNodeExpressionConstant('foo', 2, 1),
                new TwingNodeExpressionConstant('foo', 2, 1),
                2, 1
            );

            let blocks = new TwingNode();
            let macros = new TwingNode();
            let traits = new TwingNode();
            let source = new TwingSource('{{ foo }}', 'foo.twig');

            let loader = new MockLoader();
            let twing = new MockEnvironment(loader, {debug: true});
            let node = new TwingNodeModule(body, extends_, blocks, macros, traits, [], source);

            compiler = new MockCompiler(twing);

            test.same(compiler.compile(node).getSource(), `module.exports = (TwingTemplate) => {
    return new Map([
        [0, class extends TwingTemplate {
            constructor(env) {
                super(env);

                this.source = this.getSourceContext();
                this.macros = new this.Context();
                let macros = new this.Context();

                this.blocks = new Map([
                ]);
            }

            doGetParent(context) {
                return this.loadTemplate(((true) ? (\`foo\`) : (\`foo\`)), \`foo.twig\`, 2);
            }

            doDisplay(context, blocks = new Map()) {
                let macros = this.macros.clone();
                context.proxy[\`foo\`] = \`foo\`;
                this.getParent(context).display(context, this.merge(this.blocks, blocks));
            }

            getTemplateName() {
                return \`foo.twig\`;
            }

            isTraitable() {
                return false;
            }

            getSourceContext() {
                return new this.Source(\`{{ foo }}\`, \`foo.twig\`, \`\`);
            }
        }],
    ]);
};`);

            test.end();
        });

        test.end();
    });

    test.end();
});
