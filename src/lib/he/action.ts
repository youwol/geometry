import { Stack } from './Stack'

/**
 * @brief Base class for all actions. Note that it is not mandatory to use this class
 * to define an action (see ActionPool.execute())
 * @see ActionPool
 * @category Actions
 */
export abstract class Action {
    private _valid = true
    private _name: string

    constructor(name: string) {
        this._name = name
    }

    /**
     * @return An object which described what changed
     */
    abstract do(): any

    /**
     * @return An object which described what changed
     */
    abstract undo(): any

    get name(): string {
        return this._name
    }
    get valid() {
        return this._valid
    }

    set name(n: string) {
        this._name = n
    }
    set valid(v: boolean) {
        this._valid = v
    }
}

/**
 * @brief Allow to build an Action from 2 functions or lambdas (do and undo)
 * @category Actions
 */
export class FunctionAction extends Action {
    private _do: Function = undefined
    private _undo: Function = undefined

    constructor(do_: Function, undo_: Function, name = 'function-action') {
        super(name)
        this._do = do_
        this._undo = undo_
    }

    do() {
        this._do()
    }

    undo() {
        this._undo()
    }
}

/**
 * @brief A macro action is an ordered group of actions that can be undone and
 * redone all in one go.
 * @category Actions
 */
export class MacroAction extends Action {
    private _actions: Array<Action> = []

    constructor(name = 'macro-action') {
        super(name)
    }

    register(do_: Function, undo_: Function) {
        if (do_ instanceof Action) {
            if (do_.valid === true) {
                this._actions.push(do_ as Action)
            }
        } else {
            console.assert(undo_ !== undefined)
            this._actions.push(new FunctionAction(do_, undo_))
        }
    }

    do() {
        this._actions.forEach((action) => action.do())
    }
    undo() {
        this._actions.reverse().forEach((action) => action.undo())
        this._actions.reverse()
    }
}

/**
 * @brief A Pool of actions for undo/redo purpose
 * @category Actions
 */
export class ActionPool {
    private _undo: Stack<Action> = new Stack()
    private _do: Stack<Action> = new Stack()
    private _size = 10

    constructor(size = 10) {
        this._size = size
    }

    /**
     * Register and execute an action.
     * @note Only valid actions are registered in the pool (and then executed of couse).
     * @param do_ Can be either a function (or lambda) or an Action
     * @param undo_ If do_ is an Action, undo_ is irrelevant.
     */
    execute(do_: any, undo_?: Function, name?: string): boolean {
        let act = undefined
        if (do_ instanceof Action) {
            if (do_.valid === false) {
                return false
            }
            act = do_
        } else {
            console.assert(undo_ !== undefined)
            act = new FunctionAction(do_, undo_, name)
        }

        this._do.push(act)
        act.do()
        if (this._do.count > this._size) {
            this._do.shift()
        }

        if (this._undo.count !== 0) {
            this._undo.clear()
        }

        return true
    }

    undo(n = 1) {
        for (let i = 0; i < n; ++i) {
            this.__undo()
        }
    }

    redo(n = 1) {
        for (let i = 0; i < n; ++i) {
            this.__redo()
        }
    }

    clear() {
        this._do.clear()
        this._undo.clear()
    }

    get maxSize() {
        return this._size
    }
    set maxSize(s: number) {
        this._size = s
    }

    get undoActionNames() {
        return this._do.map((a) => a.name).reverse()
    }

    get redoActionNames() {
        return this._undo.map((a) => a.name).reverse()
    }

    private __undo(): Action {
        if (this._do.count === 0) {
            return undefined
        }

        const act = this._do.last
        this._do.pop()
        act.undo()
        this._undo.push(act)

        // Check the stack size limit
        if (this._undo.count > this._size) {
            this._undo.shift()
        }
        return act
    }

    private __redo(): Action {
        if (this._undo.count === 0) {
            return undefined
        }

        const act = this._undo.last
        this._undo.pop()
        act.do()
        this._do.push(act)

        // Check the stack size limit
        if (this._do.count > this._size) {
            this._do.shift()
        }
        return act
    }
}
