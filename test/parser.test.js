/*
 * META Platform library
 * Shortcode parser - TEST
 *
 * @author META Platform <www.meta-platform.com>
 * @license See LICENSE file distributed with this source code
 */

var should = require("should");

var ShortcodeParser = require(__dirname + "/../lib/parser.js");

describe("ShortcodeParser", function () {
  describe("#constructor", function () {
    it("should construct with default options", function () {
      var parser = ShortcodeParser();

      parser.options.should.eql({
        openPattern: "\\[",
        closePattern: "\\]",
      });
    });

    it("should construct with specified options", function () {
      var parser = ShortcodeParser({
        openPattern: "\\{\\{",
        closePattern: "\\}\\}",
      });

      parser.options.should.eql({
        openPattern: "\\{\\{",
        closePattern: "\\}\\}",
      });
    });
  });

  describe("#add", function () {
    var parser = ShortcodeParser();

    it("should register shortcode", function () {
      var handler = function () {
        return;
      };

      parser.add("test", handler);

      parser.shortcodes.test.should.eql(handler);
    });
  });

  describe("#parse", function () {
    it("should parse non-shortcode string as it is", async function () {
      var parser = ShortcodeParser();

      const result = await parser.parse("Some test should work.");

      result.should.eql("Some test should work.");
    });

    it("should parse basic self-closing shortcode", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return "OK";
      });

      const result = await parser.parse("Some [test/] should work.");

      result.should.eql("Some OK should work.");
    });

    it("should parse basic pair shortcode", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return content.toUpperCase();
      });

      const result = await parser.parse("Some [test]ok[/test] should work.");

      result.should.eql("Some OK should work.");
    });

    it("should parse single argument", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return opts.OK;
      });

      const result = await parser.parse("Some [test OK/] should work.");

      result.should.eql("Some OK should work.");
    });

    it("should parse multiple arguments", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return Object.keys(opts).join("+");
      });

      const result = await parser.parse("Some [test A B/] should work.");

      result.should.eql("Some A+B should work.");
    });

    it("should parse single attribute", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return opts.a;
      });

      const result = await parser.parse("Some [test a=B/] should work.");

      result.should.eql("Some B should work.");
    });

    it("should parse camelCase name", async function () {
      var parser = ShortcodeParser();

      parser.add("testThis", async function (opts, content) {
        return opts.a;
      });

      const result = await parser.parse("Some [testThis a=B/] should work.");

      result.should.eql("Some B should work.");
    });

    it("should parse CapitalCase name", async function () {
      var parser = ShortcodeParser();

      parser.add("TestThis", async function (opts, content) {
        return opts.a;
      });

      const result = await parser.parse("Some [TestThis a=B/] should work.");

      result.should.eql("Some B should work.");
    });

    it("should parse snake_case name", async function () {
      var parser = ShortcodeParser();

      parser.add("test_this", async function (opts, content) {
        return opts.a;
      });

      const result = await parser.parse("Some [test_this a=B/] should work.");

      result.should.eql("Some B should work.");
    });

    it("should return props as an object", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return JSON.stringify(opts);
      });

      const result = await parser.parse(`[test a=foo b=bar/]`);

      result.should.eql(JSON.stringify({ a: "foo", b: "bar" }));
    });

    it("should parse multiple attributes", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return opts.a + "+" + opts.c;
      });

      const result = await parser.parse("Some [test a=B c=D/] should work.");

      result.should.eql("Some B+D should work.");
    });

    it("should parse both arguments and attributes mixed", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return Object.entries(opts).reduce((out, cv) => out + cv[0] + cv[1], "");
      });

      const result = await parser.parse("Some [test 1 2 3 a=B x=Y/] should work.");

      result.should.eql("Some 112233aBxY should work.");
    });

    it("should parse &quot; as quote.", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return opts.apple;
      });

      const result = await parser.parse("Some [test apple=&quot;yes&quot;/] should work.");

      result.should.eql("Some yes should work.");
    });

    it("should parse arguments in quotes with respect to escaping", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return JSON.stringify(opts);
      });

      const result = await parser.parse(
        "Some [test \"long attribute\" 'another escaped attribute' 'long=key'='evil\"value'/] should work."
      );

      result.should.eql(
        'Some {"long attribute":"long attribute","another escaped attribute":"another escaped attribute","long=key":"evil\\"value"} should work.'
      );
    });

    it("should parse multiple shortcodes", async function () {
      var parser = ShortcodeParser();

      parser.add("test1", async function (opts, content) {
        return "A";
      });

      parser.add("test2", async function (opts, content) {
        return "B";
      });

      const result = await parser.parse("Some [test1/] and [test2/] should work.");

      result.should.eql("Some A and B should work.");
    });

    it("should parse nested shortcodes", async function () {
      var parser = ShortcodeParser();

      parser.add("test1", async function (opts, content) {
        return content.toUpperCase();
      });

      parser.add("test2", async function (opts, content) {
        return "b";
      });

      const result = await parser.parse("Some [test1]nested [test2/] should[/test1] work.");

      result.should.eql("Some NESTED B SHOULD work.");
    });

    it("should parse multiple nested shortcodes", async function () {
      var parser = ShortcodeParser();

      parser.add("test1", async function (opts, content) {
        return content.toUpperCase();
      });

      parser.add("test2", async function (opts, content) {
        return "b";
      });

      const result = await parser.parse("Some [test1]nested [test1][test2/][/test1] [test2/] should[/test1] work.");

      result.should.eql("Some NESTED B B SHOULD work.");
    });

    it("should mark unknown shortcode", async function () {
      var parser = ShortcodeParser();

      const result = await parser.parse(
        "Some [test1]pair with [test3/] nested[/test1] and [test2/] shortcode. [another sc"
      );

      result.should.eql("Some [!test1!]pair with [!test3!/] nested[/!test1!] and [!test2!/] shortcode. [!another!/]");
    });

    it("should mark error if no tag name", async function () {
      var parser = ShortcodeParser();

      const result = await parser.parse("Some [.");

      result.should.eql("Some [^!].");
    });

    it("should mark error if unclosed tag body", async function () {
      var parser = ShortcodeParser();

      const result = await parser.parse("Some [test with unclosed attributes");
      result.should.eql("Some [!test!/]");
    });

    it("should mark error if unclosed pair tag", async function () {
      var parser = ShortcodeParser();
      const result = await parser.parse("Some [test]with content");
      result.should.eql("Some [!test!]with content");
    });

    it("should mark error if broken closing tag", async function () {
      var parser = ShortcodeParser();

      const result = await parser.parse("Some [test]with content[/test");
      result.should.eql("Some [!test!]with content[/test");
    });

    it("should mark error if different closing tag", async function () {
      var parser = ShortcodeParser();
      const result = await parser.parse("Some [test]with content[/test2]");
      result.should.eql("Some [!test!]with content[/test2]");
    });

    it("should parse shortcode with alternative brackets", async function () {
      var parser = ShortcodeParser({
        openPattern: "\\{{",
        closePattern: "\\}}",
      });

      parser.add("test", async function (opts, content) {
        return "OK";
      });

      let result = await parser.parse("Some {{test/}} should work.");
      result.should.eql("Some OK should work.");

      result = await parser.parse("Some {{test}}content{{/test}} should work.");
      result.should.eql("Some OK should work.");
    });

    it("should parse shortcode with alternative brackets <{}>", async function () {
      var parser = ShortcodeParser({
        openPattern: "<{",
        closePattern: "}>",
      });

      let props;
      parser.add("test", async function (opts, content) {
        props = content;
        return "OK";
      });

      let result = await parser.parse("Some <{test/}> should work.");
      result.should.eql("Some OK should work.");

      result = await parser.parse("Some <{test}>content<{/test}> should work.");
      result.should.eql("Some OK should work.");
      props.should.eql("content");
    });

    it("should parse shortcode with alternative brackets {> <}", async function () {
      var parser = ShortcodeParser({
        openPattern: "{>",
        closePattern: "<}",
      });

      parser.add("test", async function (opts, content) {
        return "OK";
      });

      const result = await parser.parse("Some {>test/<} should work.");
      result.should.eql("Some OK should work.");
    });

    it("should ignore shortcode with escaped opening pattern", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return "OK";
      });

      const result = await parser.parse(
        "Some \\[test/] \\[test] [test /] \\[test] \\[test /] [/test] should be ignored."
      );

      result.should.eql("Some [test/] [test] OK [test] [test /] [/test] should be ignored.");
    });

    it("should ignore shortcode with escaped opening pattern nested in regular shortcode", async function () {
      var parser = ShortcodeParser();

      parser.add("test", async function (opts, content) {
        return content.toUpperCase();
      });

      const result = await parser.parse(
        "Some [test]nested \\[shortcode] or \\[shortcode /] or \\[shortcode]...[/shortcode][/test] should be ignored."
      );

      result.should.eql("Some NESTED [SHORTCODE] OR [SHORTCODE /] OR [SHORTCODE]...[/SHORTCODE] should be ignored.");
    });
  });
});
