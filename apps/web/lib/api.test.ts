import { ApiError, apiFetch } from "@/lib/api";

describe("apiFetch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("envia token e body JSON quando informado", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ "content-type": "application/json" }),
      json: async () => ({ ok: true })
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await apiFetch<{ ok: boolean }>("/groups/1", {
      method: "POST",
      token: "abc123",
      body: { name: "Pelada" }
    });

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/groups/1",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer abc123",
          "Content-Type": "application/json"
        }),
        body: JSON.stringify({ name: "Pelada" }),
        cache: "no-store"
      })
    );
  });

  it("levanta ApiError usando detail do backend", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        headers: new Headers({ "content-type": "application/json" }),
        json: async () => ({ detail: "Sem permissao" })
      })
    );

    await expect(apiFetch("/groups/1")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        message: "Sem permissao",
        status: 403
      })
    );
  });
});
