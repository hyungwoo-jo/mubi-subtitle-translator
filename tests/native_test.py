import importlib.util
import io
import json
from pathlib import Path
import struct
import subprocess
import unittest
import tempfile
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("host", ROOT / "native/host.py")
host = importlib.util.module_from_spec(spec)
spec.loader.exec_module(host)


class NativeTests(unittest.TestCase):
    def request(self):
        return {"action": "translate", "model": "gpt-6-luna", "language": "한국어",
                "items": [{"id": 0, "text": "Hello"}]}

    def test_rejects_arbitrary_commands_and_bad_batches(self):
        for request in [{"action": "exec", "command": "whoami"},
                        {**self.request(), "model": "gpt-6-luna; whoami"},
                        {**self.request(), "items": [{"id": 4, "text": "Hi"}]}]:
            with self.assertRaises(ValueError):
                host.validate_request(request)

    @patch.object(host.shutil, "which", return_value="/mock/codex")
    def test_cli_uses_stdin_and_preserves_subscription_auth(self, _which):
        def runner(args, **kwargs):
            if args[1:]==["login", "status"]:
                return subprocess.CompletedProcess(args, 0, stdout="Logged in using ChatGPT", stderr="")
            self.assertIn("--ignore-user-config", args)
            self.assertIn("read-only", args)
            self.assertIn("features.shell_tool=false", args)
            self.assertNotIn("OPENAI_API_KEY", kwargs["env"])
            self.assertEqual(args[-1], "-")
            schema=json.loads(Path(args[args.index('--output-schema')+1]).read_text())['properties']['items']
            self.assertEqual(schema['minItems'],1)
            self.assertEqual(schema['maxItems'],1)
            self.assertEqual(schema['items']['properties']['id']['enum'],[0])
            self.assertIn("Hello", kwargs["input"])
            self.assertIn("Automatically detect the source language", kwargs["input"])
            self.assertIn("OUTPUT language", kwargs["input"])
            result = Path(args[args.index("--output-last-message")+1])
            result.write_text(json.dumps({"items": [{"id": 0, "text": "안녕하세요"}]}))
            kwargs['stdout'].write(json.dumps({'type':'turn.completed','usage':{'input_tokens':120,'cached_input_tokens':80,'output_tokens':9}})+'\n')
            return subprocess.CompletedProcess(args, 0)
        with patch.dict(host.os.environ, {"OPENAI_API_KEY": "synthetic-test-value"}):
            result=host.handle(self.request(), runner)
            self.assertEqual(result["items"][0]["text"], "안녕하세요")
            self.assertEqual(result["usage"], {"input_tokens":120,"cached_input_tokens":80,"output_tokens":9})

    @patch.object(host.shutil, "which", return_value="/mock/codex")
    def test_failure_does_not_expose_process_output(self, _which):
        def runner(args, **_kwargs):
            if args[1:]==["login", "status"]:
                return subprocess.CompletedProcess(args, 0, stdout="Logged in using ChatGPT", stderr="")
            return subprocess.CompletedProcess(args, 1)
        self.assertFalse(host.handle(self.request(), runner)["ok"])

    @patch.object(host.shutil, "which", return_value="/mock/codex")
    def test_rejects_missing_response_ids(self, _which):
        def runner(args, **_kwargs):
            if args[1:]==["login", "status"]:
                return subprocess.CompletedProcess(args, 0, stdout="Logged in using ChatGPT", stderr="")
            Path(args[args.index("--output-last-message")+1]).write_text('{"items":[{"id":2,"text":"wrong"}]}')
            return subprocess.CompletedProcess(args, 0)
        self.assertFalse(host.handle(self.request(), runner)["ok"])

    @patch.object(host.shutil, "which", return_value="/mock/codex")
    def test_api_key_login_is_rejected_before_any_translation(self, _which):
        calls = []
        def runner(args, **_kwargs):
            calls.append(args)
            return subprocess.CompletedProcess(args, 0, stdout="Logged in using an API key", stderr="")
        self.assertFalse(host.handle(self.request(), runner)["ok"])
        self.assertEqual(len(calls), 1)

    def test_read_exact_handles_partial_reads_and_eof(self):
        self.assertEqual(host.read_exact(io.BytesIO(b"abc"), 3), b"abc")
        with self.assertRaises(EOFError):
            host.read_exact(io.BytesIO(b"a"), 2)

    def test_diagnostic_saves_metadata_without_invoking_codex(self):
        with tempfile.TemporaryDirectory() as temp:
            request={"action":"diagnostic","reports":[{"frameId":0,"snapshot":{"hostname":"mubi.com","videos":[]}}]}
            def runner(*_args, **_kwargs):
                self.fail("Diagnostic must not invoke the model")
            with patch.object(host,"__file__",str(Path(temp)/"native/host.py")):
                self.assertTrue(host.handle(request,runner)["ok"])
            saved=json.loads((Path(temp)/"data/caption-diagnostic-frame-0.json").read_text())
            self.assertEqual(saved["snapshot"]["hostname"],"mubi.com")

    def test_diagnostic_rejects_invalid_frame_ids(self):
        for frame in ("../escape",-1,True,1_000_000):
            with self.assertRaises(ValueError):
                host.validate_request({"action":"diagnostic","reports":[{"frameId":frame,"snapshot":{}}]})

    @patch.object(host, 'ollama_call')
    def test_ollama_uses_schema_and_validates_ids(self, call):
        call.return_value={'message':{'content':'{"items":[{"id":0,"text":"안녕하세요"}]}'},'prompt_eval_count':42,'eval_count':9}
        request={**self.request(),'provider':'ollama','model':'local/model:tag'}
        result=host.handle(request)
        self.assertTrue(result['ok'])
        self.assertEqual(result['usage']['input_tokens'],42)
        path,payload=call.call_args.args
        self.assertEqual(path,'/api/chat')
        self.assertFalse(payload['stream'])
        self.assertEqual(payload['format']['properties']['items']['maxItems'],1)
        call.return_value={'message':{'content':'{"items":[{"id":7,"text":"wrong"}]}'}}
        self.assertFalse(host.handle(request)['ok'])

    @patch.object(host, 'ollama_call', return_value={'models':[]})
    def test_ollama_health_does_not_require_codex(self, call):
        result=host.handle({'action':'health','provider':'ollama'})
        self.assertTrue(result['ok'])
        call.assert_called_once_with('/api/tags')

    def test_unknown_provider_is_rejected(self):
        with self.assertRaises(ValueError):
            host.validate_request({**self.request(),'provider':'arbitrary-command'})

    def test_native_protocol_health_round_trip(self):
        body = json.dumps({"action": "health"}).encode()
        result = subprocess.run(["python3", str(ROOT / "native/host.py")],
                                input=struct.pack("<I", len(body))+body, capture_output=True, check=True)
        length = struct.unpack("<I", result.stdout[:4])[0]
        payload = json.loads(result.stdout[4:])
        self.assertEqual(length, len(result.stdout)-4)
        self.assertEqual(payload["version"], host.VERSION)


if __name__ == "__main__":
    unittest.main()
