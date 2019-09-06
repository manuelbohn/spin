Methods
=======

.. _enumerate:

Enumeration
-----------

.. js:function:: Infer({model: ..., method: 'enumerate'[, ...]})

   This method performs inference by enumeration.

   The following options are supported:

   .. describe:: maxExecutions

      Maximum number of (complete) executions to enumerate.

      Default: ``Infinity``

   .. describe:: strategy

      The traversal strategy used to explore executions. Either
      ``'likelyFirst'``, ``'depthFirst'`` or ``'breadthFirst'``.

      Default: ``'likelyFirst'`` if ``maxExecutions`` is finite,
      ``'depthFirst'`` otherwise.

   Example usage::

     Infer({method: 'enumerate', maxExecutions: 10, model: model});
     Infer({method: 'enumerate', strategy: 'breadthFirst', model: model});

Rejection sampling
------------------

.. js:function:: Infer({model: ..., method: 'rejection'[, ...]})

   This method performs inference using rejection sampling.

   The following options are supported:

   .. describe:: samples

      The number of samples to take.

      Default: ``100``

   .. describe:: maxScore

      An upper bound on the total factor score per-execution.

      Default: ``0``

   .. describe:: incremental

      Enable incremental mode.

      Default: ``false``

   Incremental mode improves efficiency by rejecting samples before
   execution reaches the end of the program where possible. This
   requires every call to ``factor(score)`` in the program (across all
   possible executions) to have ``score <= 0``.

   Example usage::

     Infer({method: 'rejection', samples: 100, model: model});

MCMC
----

.. js:function:: Infer({model: ..., method: 'MCMC'[, ...]})

   This method performs inference using Markov chain Monte Carlo.

   The following options are supported:

      .. describe:: samples

         The number of samples to take.

         Default: ``100``

      .. describe:: lag

         The number of additional iterations to perform between
         samples.

         Default: ``0``

      .. describe:: burn

         The number of additional iterations to perform before
         collecting samples.

         Default: ``0``

      .. describe:: kernel

         The transition kernel to use for inference. See `Kernels`_.

         Default: ``'MH'``

      .. describe:: verbose

         When ``true``, print the current iteration and acceptance
         ratio to the console during inference.

         Default: ``false``

      .. describe:: onlyMAP

         When ``true``, only the sample with the highest score is
         retained. The marginal is a delta distribution on this value.

         Default: ``false``

   Example usage::

     Infer({method: 'MCMC', samples: 1000, lag: 100, burn: 5, model: model});

Kernels
^^^^^^^

The following kernels are available:

.. _mh:

.. describe:: MH

   Implements single site Metropolis-Hastings. [wingate11]_

   This kernel makes use of any :ref:`drift kernels <driftkernels>`
   specified in the model.

Example usage::

    Infer({method: 'MCMC', kernel: 'MH', model: model});

.. _hmc:

.. describe:: HMC

   Implements Hamiltonian Monte Carlo. [neal11]_

   As the HMC algorithm is only applicable to continuous variables,
   ``HMC`` is a cycle kernel which includes a MH step for discrete
   variables.

   The following options are supported:

   .. describe:: steps

      The number of steps to take per-iteration.

      Default: ``5``

   .. describe:: stepSize

      The size of each step.

      Default: ``0.1``

Example usage::

    Infer({method: 'MCMC', kernel: 'HMC', model: model});
    Infer({method: 'MCMC', kernel: {HMC: {steps: 10, stepSize: 1}}, model: model});

Incremental MH
--------------

.. js:function:: Infer({model: ..., method: 'incrementalMH'[, ...]})

   This method performs inference using C3. [ritchie15]_

   This method makes use of any :ref:`drift kernels <driftkernels>`
   specified in the model.

   The following options are supported:

      .. describe:: samples

         The number of samples to take.

         Default: ``100``

      .. describe:: lag

         The number of additional iterations to perform between
         samples.

         Default: ``0``

      .. describe:: burn

         The number of additional iterations to perform before
         collecting samples.

         Default: ``0``

      .. describe:: verbose

         When ``true``, print the current iteration to the console
         during inference.

         Default: ``false``

      .. describe:: onlyMAP

         When ``true``, only the sample with the highest score is
         retained. The marginal is a delta distribution on this value.

         Default: ``false``

   Example usage::

     Infer({method: 'incrementalMH', samples: 100, lag: 5, burn: 10, model: model});

   To maximize efficiency when inferring marginals over multiple variables, use the ``query`` table, rather than building up a list of variable values::

      var model = function() {
        var hmm = function(n, obs) {
          if (n === 0) return true;
          else {
            var prev = hmm(n-1, obs);
            var state = transition(prev);
            observation(state, obs[n]);
            query.add(n, state);
            return state;
          }
        };
        hmm(100, observed_data);
        return query;
      }
      Infer({method: 'incrementalMH', samples: 100, lag: 5, burn: 10, model: model});

   ``query`` is a write-only table which can be returned from a program (and thus marginalized). The only operation it supports is adding named values:

      .. js:function:: query.add(name, value)

         :param any name: Name of value to be added to query. Will be converted to string, as JavaScript object keys are.
         :param any value: Value to be added to query.
         :returns: undefined

.. _smc:

SMC
---

.. js:function:: Infer({model: ..., method: 'SMC'[, ...]})

   This method performs inference using sequential Monte Carlo. When
   ``rejuvSteps`` is 0, this method is also known as a particle
   filter.

   The following options are supported:

      .. describe:: particles

         The number of particles to simulate.

         Default: ``100``

      .. describe:: rejuvSteps

         The number of MCMC steps to apply to each particle at each
         ``factor`` statement. With this addition, this method is
         often called a particle filter with rejuvenation.

         Default: ``0``

      .. describe:: rejuvKernel

         The MCMC kernel to use for rejuvenation. See `Kernels`_.

         Default: ``'MH'``

      .. describe:: importance

         Controls the importance distribution used during inference.

         Specifying an importance distribution can be useful when you
         know something about the posterior distribution, as
         specifying an importance distribution that is closer to the
         posterior than the prior will improve the statistical
         efficiency of inference.

         This option accepts the following values:

         * ``'default'``: When a random choice has a :ref:`guide
           distribution <guides>` specified, use that as the
           importance distribution. For all other random choices, use
           the prior.

         * ``'ignoreGuide'``: Use the prior as the importance
           distribution for all random choices.

         * ``'autoGuide'``: When a random choice has a :ref:`guide
           distribution <guides>` specified, use that as the
           importance distribution. For all other random choices, use
           a :ref:`default guide distribution <default_guides>` as the
           importance distribution.

           Default: ``'default'``

      .. describe:: onlyMAP

         When ``true``, only the sample with the highest score is
         retained. The marginal is a delta distribution on this value.

         Default: ``false``

   Example usage::

     Infer({method: 'SMC', particles: 100, rejuvSteps: 5, model: model});

Optimization
------------

.. js:function:: Infer({model: ..., method: 'optimize'[, ...]})

   This method performs inference by :ref:`optimizing <optimization>`
   the parameters of the guide program. The marginal distribution is a
   histogram constructed from samples drawn from the guide program
   using the optimized parameters.

   The following options are supported:

      .. describe:: samples

         The number of samples used to construct the marginal
         distribution.

         Default: ``100``

      .. describe:: onlyMAP

         When ``true``, only the sample with the highest score is
         retained. The marginal is a delta distribution on this value.

         Default: ``false``

   In addition, all of the options supported by :ref:`Optimize
   <optimize>` are also supported here.

   Example usage::

     Infer({method: 'optimize', samples: 100, steps: 100, model: model});

.. _forward_sampling:

Forward Sampling
----------------

.. js:function:: Infer({model: ..., method: 'forward'[, ...]})

   This method builds a histogram of return values obtained by
   repeatedly executing the program given by ``model``, ignoring any
   ``factor`` statements encountered while doing so. Since
   ``condition`` and ``observe`` are written in terms of ``factor``,
   they are also effectively ignored.

   This means that unlike all other methods described here, forward
   sampling does not perform marginal inference. However, sampling
   from a model without any factors etc. taken into account is often
   useful in practice, and this method is provided as a convenient way
   to achieve that.

   The following options are supported:

   .. describe:: samples

      The number of samples to take.

      Default: ``100``

   .. describe:: guide

      When ``true``, sample random choices from the guide. A
      :ref:`default guide distribution <default_guides>` is used for
      random choices that do not have a guide distribution specified
      explicitly.

      When ``false``, sample from the model.

      Default: ``false``

   .. describe:: onlyMAP

      When ``true``, only the sample with the highest score is
      retained. The marginal is a delta distribution on this value.

      Default: ``false``

   Example usage::

     Infer({method: 'forward', model: model});
     Infer({method: 'forward', guide: true, model: model});

.. rubric:: Bibliography

.. [wingate11] David Wingate, Andreas Stuhlmüller, and Noah D.
               Goodman. "Lightweight implementations of probabilistic
               programming languages via transformational
               compilation." International Conference on Artificial
               Intelligence and Statistics. 2011.

.. [neal11] Radford M. Neal, "MCMC using Hamiltonian dynamics."
            Handbook of Markov Chain Monte Carlo 2 (2011).

.. [ritchie15] Daniel Ritchie, Andreas Stuhlmüller, and Noah D.
               Goodman. "C3: Lightweight Incrementalized MCMC for
               Probabilistic Programs using Continuations and Callsite
               Caching." International Conference on Artificial
               Intelligence and Statistics. 2016.
