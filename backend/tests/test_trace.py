from mesa.trace import create_trace, finish_trace, get_run_stats, record_step


def test_trace_records_steps_and_aggregates():
    trace = create_trace("run-1")
    record_step(trace, "planner", "in", "out", 10, 5)
    record_step(trace, "writer", "in", "out", 20, 7)
    record_step(trace, "writer", "in", "out", 30, 3)

    assert trace.total_tokens == 60
    assert trace.total_latency_ms == 15
    stats = get_run_stats(trace)
    assert stats["tokens"]["writer"] == 50
    assert stats["calls"]["writer"] == 2


def test_trace_terminates_with_reason():
    trace = finish_trace(create_trace("run-2"), "approved")
    assert trace.terminated is True
    assert trace.termination_reason == "approved"
