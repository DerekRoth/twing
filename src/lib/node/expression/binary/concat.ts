import {TwingNodeExpressionBinary} from "../binary";
import {TwingCompiler} from "../../../compiler";
import {TwingNode, TwingNodeType} from "../../../node";

export class TwingNodeExpressionBinaryConcat extends TwingNodeExpressionBinary {
    constructor(nodes: [TwingNode, TwingNode], lineno: number, columno: number) {
        super(nodes, lineno, columno);

        this.type = TwingNodeType.EXPRESSION_BINARY_CONCAT;
    }

    operator(compiler: TwingCompiler) {
        return compiler.raw('+');
    }
}
